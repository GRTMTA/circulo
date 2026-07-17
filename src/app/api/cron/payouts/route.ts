import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import {
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  TransactionBuilder,
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";

import { circleIdToScVal } from "@/services/contractService";
import { env, getTokenContractId } from "@/lib/env";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 3;
const STALE_PROCESSING_MS = 15 * 60 * 1000;

type Circle = {
  id: string;
  status: string;
  current_round: number;
  total_rounds: number;
  contribution_amount: number | string;
  contribution_asset: string;
};

type PayoutSchedule = {
  id: string;
  status: "scheduled" | "ready" | "processing" | "paid" | "delayed" | "failed" | "disputed";
  attempt_count: number | null;
  processing_token: string | null;
  submitted_at: string | null;
  expected_payout_at: string | null;
  payout_amount: number | string | null;
  recipient_member_id: string | null;
};

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

async function getOnChainRound(server: rpc.Server, sourceAddress: string, circleId: string) {
  const account = await server.getAccount(sourceAddress);
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: env.sorobanNetworkPassphrase,
  })
    .addOperation(new Contract(env.contractId).call("current_round", circleIdToScVal(circleId)))
    .setTimeout(30)
    .build();
  const simulation = await server.simulateTransaction(transaction);
  if (!rpc.Api.isSimulationSuccess(simulation) || !simulation.result) {
    throw new Error("Could not read the circle's on-chain round.");
  }
  return Number(scValToNative(simulation.result.retval));
}

async function submitPayout(
  server: rpc.Server,
  relayer: Keypair,
  circleId: string,
  tokenContractId: string,
) {
  const account = await server.getAccount(relayer.publicKey());
  const operation = new Contract(env.contractId).call(
    "execute_payout",
    circleIdToScVal(circleId),
    Address.fromString(relayer.publicKey()).toScVal(),
    Address.fromString(tokenContractId).toScVal(),
  );
  const transaction = await server.prepareTransaction(
    new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: env.sorobanNetworkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(60)
      .build(),
  );
  transaction.sign(relayer);
  const submission = await server.sendTransaction(transaction);
  if (submission.status === "ERROR") {
    throw new Error("Soroban RPC rejected the payout transaction.");
  }
  const result = await server.pollTransaction(submission.hash, { attempts: 20 });
  if (result.status !== "SUCCESS") {
    throw new Error(`Payout transaction did not succeed (${result.status}).`);
  }
  return submission.hash;
}

/**
 * Permissionless, server-side payout worker. Run it from Vercel Cron or an
 * external scheduler every few minutes with Authorization: Bearer CRON_SECRET.
 * The processing-token claim is the idempotency boundary: only the worker that
 * successfully changes a row into `processing` may settle that row.
 */
export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const relayerSecret = process.env.STELLAR_RELAYER_SECRET_KEY ?? process.env.SOROBAN_RELAYER_SECRET_KEY;
  if (!supabaseUrl || !serviceRoleKey || !relayerSecret) {
    return NextResponse.json({ error: "Payout worker is not configured" }, { status: 503 });
  }

  let relayer: Keypair;
  try {
    relayer = Keypair.fromSecret(relayerSecret);
  } catch {
    return NextResponse.json({ error: "The payout relayer secret is invalid" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const server = new rpc.Server(env.sorobanRpcUrl);
  const now = new Date();
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  const { data: circles, error } = await supabase
    .from("circles")
    .select("id, status, current_round, total_rounds, contribution_amount, contribution_asset")
    .eq("status", "active")
    .returns<Circle[]>();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  for (const circle of circles ?? []) {
    const roundNumber = circle.current_round;
    if (roundNumber < 1 || roundNumber > circle.total_rounds) {
      skipped += 1;
      continue;
    }

    const { data: round } = await supabase
      .from("circle_rounds")
      .select("id, round_number, due_at, payout_member_id")
      .eq("circle_id", circle.id)
      .eq("round_number", roundNumber)
      .maybeSingle();
    if (!round) {
      skipped += 1;
      continue;
    }

    const [{ data: members }, { data: contributions }] = await Promise.all([
      supabase
        .from("circle_members")
        .select("id, payout_round")
        .eq("circle_id", circle.id)
        .order("payout_round", { ascending: true }),
      supabase
        .from("circle_contributions")
        .select("member_id, status, tx_hash")
        .eq("circle_id", circle.id)
        .eq("round_id", round.id),
    ]);

    if (!members?.length || !round || contributions?.length !== members.length || contributions.some((item) => item.status !== "paid" || !item.tx_hash)) {
      skipped += 1;
      continue;
    }

    let onChainRound: number;
    try {
      onChainRound = await getOnChainRound(server, relayer.publicKey(), circle.id);
    } catch {
      skipped += 1;
      continue;
    }
    if (onChainRound !== roundNumber) {
      skipped += 1;
      continue;
    }

    const { data: schedule } = await supabase
      .from("payout_schedule")
      .select("id, status, attempt_count, processing_token, submitted_at, expected_payout_at, payout_amount, recipient_member_id")
      .eq("circle_id", circle.id)
      .eq("round_number", roundNumber)
      .maybeSingle();

    let scheduleData = schedule as PayoutSchedule | null;
    if (!scheduleData) {
      const payoutPosition = ((roundNumber - 1) % members.length) + 1;
      const recipient = members.find((member) => member.payout_round === payoutPosition);
      const { data: createdSchedule } = await supabase
        .from("payout_schedule")
        .insert({
          circle_id: circle.id,
          round_number: roundNumber,
          recipient_member_id: recipient?.id ?? round.payout_member_id,
          payout_amount: Number(circle.contribution_amount) * members.length,
          expected_payout_at: round.due_at,
          status: "ready",
        })
        .select("id, status, attempt_count, processing_token, submitted_at, expected_payout_at, payout_amount, recipient_member_id")
        .single();
      if (!createdSchedule) {
        skipped += 1;
        continue;
      }
      scheduleData = createdSchedule as PayoutSchedule;
    }

    if (scheduleData.status === "paid" || scheduleData.status === "processing") {
      if (scheduleData.status === "processing" && scheduleData.submitted_at && now.getTime() - new Date(scheduleData.submitted_at).getTime() > STALE_PROCESSING_MS) {
        await supabase.from("payout_schedule").update({ status: "failed", last_error: "Stale processing claim requires retry." }).eq("id", scheduleData.id).eq("status", "processing");
        scheduleData.status = "failed";
      } else {
        skipped += 1;
        continue;
      }
    }
    if (Number(scheduleData.attempt_count ?? 0) >= MAX_ATTEMPTS) {
      skipped += 1;
      continue;
    }

    const token = crypto.randomUUID();
    const { data: claimed } = await supabase
      .from("payout_schedule")
      .update({
        status: "processing",
        processing_token: token,
        attempt_count: Number(scheduleData.attempt_count ?? 0) + 1,
        submitted_at: now.toISOString(),
        last_error: null,
      })
      .eq("id", scheduleData.id)
      .in("status", ["scheduled", "ready", "delayed", "failed"])
      .select("id")
      .maybeSingle();
    if (!claimed) {
      skipped += 1;
      continue;
    }

    await supabase.from("audit_events").insert({
      circle_id: circle.id,
      member_id: scheduleData.recipient_member_id,
      event_type: "payout_processing",
      round_number: roundNumber,
      metadata: {
        amount: Number(scheduleData.payout_amount ?? Number(circle.contribution_amount) * members.length),
        asset: circle.contribution_asset,
        expected_payout_at: scheduleData.expected_payout_at,
        status: "processing",
        idempotency_token: token,
      },
    });

    try {
      const hash = await submitPayout(server, relayer, circle.id, getTokenContractId(circle.contribution_asset));
      const isFinalRound = roundNumber >= circle.total_rounds;
      const paidAt = new Date().toISOString();
      await supabase.from("payout_schedule").update({ status: "paid", tx_hash: hash, processed_at: paidAt, last_error: null }).eq("id", scheduleData.id).eq("processing_token", token);
      await supabase.from("circle_rounds").update({ status: "paid" }).eq("id", round.id);
      if (isFinalRound) {
        await supabase.from("circles").update({ status: "completed" }).eq("id", circle.id).eq("current_round", roundNumber);
      } else {
        await supabase.from("circles").update({ current_round: roundNumber + 1 }).eq("id", circle.id).eq("current_round", roundNumber);
        await supabase.from("circle_rounds").update({ status: "active" }).eq("circle_id", circle.id).eq("round_number", roundNumber + 1);
        await supabase.from("circle_contributions").update({ status: "due_now" }).eq("circle_id", circle.id).eq("round_id", (await supabase.from("circle_rounds").select("id").eq("circle_id", circle.id).eq("round_number", roundNumber + 1).maybeSingle()).data?.id ?? "").eq("status", "pending");
      }
      await supabase.from("audit_events").insert({
        circle_id: circle.id,
        member_id: scheduleData.recipient_member_id,
        event_type: isFinalRound ? "circle_completed" : "payout_released",
        round_number: roundNumber,
        tx_hash: hash,
        metadata: {
          amount: Number(scheduleData.payout_amount ?? Number(circle.contribution_amount) * members.length),
          asset: circle.contribution_asset,
          expected_payout_at: scheduleData.expected_payout_at,
          paid_at: paidAt,
          status: "paid",
        },
      });
      try {
        revalidatePath(`/dashboard/${circle.id}`);
        revalidatePath("/dashboard", "layout");
      } catch (e) {
        console.error("Revalidation failed:", e);
      }
      processed += 1;
    } catch (payoutError) {
      failed += 1;
      const message = payoutError instanceof Error ? payoutError.message : "Payout execution failed.";
      await supabase.from("payout_schedule").update({ status: "failed", last_error: message }).eq("id", scheduleData.id).eq("processing_token", token);
      await supabase.from("audit_events").insert({
        circle_id: circle.id,
        member_id: scheduleData.recipient_member_id,
        event_type: "payout_failed",
        round_number: roundNumber,
        metadata: { status: "failed", error: message, expected_payout_at: scheduleData.expected_payout_at },
      });
      try {
        revalidatePath(`/dashboard/${circle.id}`);
        revalidatePath("/dashboard", "layout");
      } catch (e) {
        console.error("Revalidation failed:", e);
      }
    }
  }

  return NextResponse.json({ success: true, processed, failed, skipped, timestamp: now.toISOString() });
}
