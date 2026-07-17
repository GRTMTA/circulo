import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface WalletTransaction {
  id: string;
  direction: "in" | "out" | "escrow";
  type: string;
  amount: number;
  asset: string;
  transactionHash: string;
  createdAt: string;
  circleId: string;
  circleName: string;
  roundNumber: number | null;
  from: string | null;
  to: string | null;
  counterparty: string | null;
  metadata: Record<string, unknown>;
}

function numeric(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

export async function GET() {
  const authContext = await requireAuthenticatedUser("/dashboard/transactions");
  if (!authContext.configured || !authContext.user) {
    return NextResponse.json({ transactions: [] });
  }

  const supabase = await createServerSupabaseClient();
  const { data: members, error: memberError } = await supabase
    .from("circle_members")
    .select("id, circle_id, wallet_address, display_name, circles(id, name, contribution_asset)")
    .eq("profile_id", authContext.user.id);

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  const memberRows = members ?? [];
  const memberIds = memberRows.map((member) => member.id);
  const circleIds = [...new Set(memberRows.map((member) => member.circle_id))];
  if (memberIds.length === 0 || circleIds.length === 0) {
    return NextResponse.json({ transactions: [] });
  }

  const [{ data: contributions }, { data: payouts }, { data: auditEvents }] = await Promise.all([
    supabase
      .from("circle_contributions")
      .select("id, circle_id, round_id, member_id, amount_due, status, tx_hash, paid_at, circle_rounds(round_number)")
      .in("member_id", memberIds)
      .eq("status", "paid"),
    supabase
      .from("payout_schedule")
      .select("id, circle_id, round_number, recipient_member_id, payout_amount, status, tx_hash, processed_at, expected_payout_at")
      .in("circle_id", circleIds)
      .in("recipient_member_id", memberIds)
      .eq("status", "paid"),
    supabase
      .from("audit_events")
      .select("id, circle_id, member_id, event_type, round_number, tx_hash, metadata, created_at")
      .in("circle_id", circleIds)
      .in("member_id", memberIds)
      .not("tx_hash", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  const circleMap = new Map(
    memberRows.map((member) => {
      const circle = Array.isArray(member.circles) ? member.circles[0] : member.circles;
      return [member.circle_id, {
        name: circle?.name ?? "Circle",
        asset: circle?.contribution_asset ?? "XLM",
      }];
    }),
  );
  const memberMap = new Map(memberRows.map((member) => [member.id, member]));
  const result: WalletTransaction[] = [];
  const seen = new Set<string>();

  function add(transaction: WalletTransaction) {
    const key = `${transaction.type}:${transaction.transactionHash}:${transaction.circleId}:${transaction.roundNumber ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(transaction);
  }

  for (const contribution of contributions ?? []) {
    if (!contribution.tx_hash) continue;
    const member = memberMap.get(contribution.member_id);
    const circle = circleMap.get(contribution.circle_id);
    const round = Array.isArray(contribution.circle_rounds)
      ? contribution.circle_rounds[0]
      : contribution.circle_rounds;
    add({
      id: `contribution-${contribution.id}`,
      direction: "out",
      type: "Contribution",
      amount: numeric(contribution.amount_due),
      asset: circle?.asset ?? "XLM",
      transactionHash: contribution.tx_hash,
      createdAt: contribution.paid_at ?? new Date(0).toISOString(),
      circleId: contribution.circle_id,
      circleName: circle?.name ?? "Circle",
      roundNumber: round?.round_number ?? null,
      from: member?.wallet_address ?? null,
      to: null,
      counterparty: "Circle escrow",
      metadata: { member_id: contribution.member_id, contribution_id: contribution.id },
    });
  }

  for (const payout of payouts ?? []) {
    if (!payout.tx_hash) continue;
    const recipient = memberMap.get(payout.recipient_member_id);
    const circle = circleMap.get(payout.circle_id);
    add({
      id: `payout-${payout.id}`,
      direction: "in",
      type: "Payout",
      amount: numeric(payout.payout_amount),
      asset: circle?.asset ?? "XLM",
      transactionHash: payout.tx_hash,
      createdAt: payout.processed_at ?? payout.expected_payout_at ?? new Date(0).toISOString(),
      circleId: payout.circle_id,
      circleName: circle?.name ?? "Circle",
      roundNumber: payout.round_number,
      from: null,
      to: recipient?.wallet_address ?? null,
      counterparty: "Circle escrow",
      metadata: { recipient_member_id: payout.recipient_member_id },
    });
  }

  for (const event of auditEvents ?? []) {
    if (!event.tx_hash) continue;
    const metadata = (event.metadata ?? {}) as Record<string, unknown>;
    const circle = circleMap.get(event.circle_id);
    const member = memberMap.get(event.member_id ?? "");
    const isIncoming = event.event_type === "collateral_refunded" || event.event_type === "payout_released";
    const isEscrow = event.event_type === "collateral_slashed";
    if (!['collateral_posted', 'collateral_refunded', 'collateral_slashed'].includes(event.event_type)) continue;
    add({
      id: `audit-${event.id}`,
      direction: isEscrow ? "escrow" : isIncoming ? "in" : "out",
      type: event.event_type === "collateral_posted"
        ? "Collateral posted"
        : event.event_type === "collateral_refunded"
          ? "Collateral refunded"
          : "Collateral slashed",
      amount: numeric(metadata.amount ?? metadata.refund_amount ?? metadata.slashed_amount),
      asset: typeof metadata.asset === "string" ? metadata.asset : circle?.asset ?? "XLM",
      transactionHash: event.tx_hash,
      createdAt: event.created_at,
      circleId: event.circle_id,
      circleName: circle?.name ?? "Circle",
      roundNumber: event.round_number,
      from: typeof metadata.from_wallet === "string" ? metadata.from_wallet : member?.wallet_address ?? null,
      to: typeof metadata.to_wallet === "string" ? metadata.to_wallet : null,
      counterparty: typeof metadata.recipient_name === "string" ? metadata.recipient_name : "Circle escrow",
      metadata,
    });
  }

  result.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  return NextResponse.json({ transactions: result });
}
