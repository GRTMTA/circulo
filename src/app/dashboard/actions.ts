"use server";

import { revalidatePath } from "next/cache";

import { StrKey } from "@stellar/stellar-sdk";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getTokenContractId, env } from "@/lib/env";
import { isValidIanaTimeZone } from "@/lib/time-zone";
import { verifyContributeTransaction } from "@/services/contractService";
import {
  isValidStellarPublicKey,
  validateBasics,
  validateCollateral,
  validateRoster,
  MIN_CYCLE_MEMBERS,
} from "@/lib/create/validation";

export interface CreateBasicsInput {
  name: string;
  contributionAmount: number;
  contributionAsset: "USDC" | "USDT" | "XLM";
  cycleCount: number;
  timeZone: string;
  intervalSeconds: number;
  memberCount: number;
  payoutOrderMode: "creator" | "voting";
}

export interface CreateRosterMemberInput {
  displayName: string;
  walletAddress: string;
}

export interface CreateCollateralInput {
  collateralAmount: number;
  gracePeriodHours: number;
  slashPercentage: number;
}

export interface CreatePayoutOrderItemInput extends CreateRosterMemberInput {
  payoutRound: number;
}

export async function createCircleAction(
  basics: CreateBasicsInput,
  roster: CreateRosterMemberInput[],
  collateral: CreateCollateralInput,
  payoutOrder: CreatePayoutOrderItemInput[],
  creatorWalletAddress?: string
) {
  const authContext = await requireAuthenticatedUser("/dashboard/create");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Authentication required" };
  }

  const supabase = await createServerSupabaseClient();

  const basicsValidation = validateBasics(basics);
  const rosterValidation = validateRoster(roster, basics.memberCount);
  const collateralValidation = validateCollateral(collateral);
  if (!basicsValidation.valid || !rosterValidation.valid || !collateralValidation.valid) {
    return { success: false, error: "Circle details are invalid." };
  }
  if (!isValidIanaTimeZone(basics.timeZone)) {
    return { success: false, error: "Choose a valid IANA timezone." };
  }
  if (roster.length < 1 || roster.length > basics.memberCount) {
    return { success: false, error: "Roster must have between 1 and the configured member count." };
  }
  if (payoutOrder.length !== roster.length) {
    return { success: false, error: "Payout order must match the roster." };
  }
  if (!creatorWalletAddress || !isValidStellarPublicKey(creatorWalletAddress)) {
    return { success: false, error: "Connect a valid Stellar testnet wallet before creating a circle." };
  }
  if (
    payoutOrder.some((item, index) =>
      item.payoutRound !== index + 1 ||
      !roster.some(
        (member) => member.walletAddress.trim().toUpperCase() === item.walletAddress.trim().toUpperCase()
      )
    )
  ) {
    return { success: false, error: "Payout order is invalid." };
  }

  const creatorAddress = creatorWalletAddress.trim().toUpperCase();

  const creatorIndex = roster.findIndex(
    (member) => member.walletAddress.trim().toUpperCase() === creatorAddress
  );
  if (creatorIndex === -1) {
    return { success: false, error: "The connected creator wallet must be in the roster." };
  }
  const actualMemberCount = roster.length;

  // 1. Insert the circle into the public.circles table
  const { data: circle, error: circleError } = await supabase
    .from("circles")
    .insert({
      creator_id: authContext.user.id,
      name: basics.name.trim(),
      status: "draft",
      contribution_amount: basics.contributionAmount,
      contribution_asset: basics.contributionAsset,
      cycle_count: basics.cycleCount,
      time_zone: basics.timeZone,
      interval_seconds: basics.intervalSeconds,
      member_count: actualMemberCount, // current roster size (can grow up to the max)
      max_member_count: basics.memberCount,
      payout_order_mode: basics.payoutOrderMode === "voting" ? "voting" : "creator",
      collateral_amount: collateral.collateralAmount,
      grace_period_hours: collateral.gracePeriodHours,
      slash_percentage: collateral.slashPercentage,
      current_round: 0, // 0 for draft mode (not started)
      total_rounds: actualMemberCount * basics.cycleCount,
      start_date: null,
      // These values are selected and persisted by the creation wizard. They
      // are therefore configuration-complete before the activation gate opens.
      settings_locked: true,
      payout_order_locked: true,
      rules_locked: true,
    })
    .select()
    .single();

  if (circleError || !circle) {
    console.error("Circle insert error:", circleError);
    return { success: false, error: circleError?.message ?? "Failed to create circle" };
  }

  // 2. Prepare members list to insert
  const membersToInsert: Array<{
    circle_id: string;
    profile_id?: string | null;
    display_name: string;
    wallet_address: string;
    role: string;
    invite_status: string;
    agreement_status: string;
    collateral_status: string;
    payment_status: string;
    payout_round: number;
    restriction_status: string;
  }> = [];

  const creatorMember = roster[creatorIndex];
  const creatorPayout = payoutOrder.find(
    (item) => item.walletAddress.trim().toUpperCase() === creatorAddress
  );
  membersToInsert.push({
    circle_id: circle.id,
    profile_id: authContext.user.id,
    display_name: creatorMember.displayName.trim(),
    wallet_address: creatorAddress,
    role: "creator",
    invite_status: "accepted",
    agreement_status: "accepted",
    collateral_status: "not_posted",
    payment_status: "not_due",
    payout_round: creatorPayout?.payoutRound ?? 1,
    restriction_status: "clear",
  });

  // Resolve profile_ids from the profiles table for invited members
  const walletAddresses = roster.map(m => m.walletAddress.trim().toUpperCase());
  const { data: resolvedProfiles } = await supabase
    .from("profiles")
    .select("id, wallet_address")
    .in("wallet_address", walletAddresses);

  const profileMap = new Map<string, string>();
  if (resolvedProfiles) {
    resolvedProfiles.forEach((p) => {
      if (p.wallet_address) {
        profileMap.set(p.wallet_address.trim().toUpperCase(), p.id);
      }
    });
  }

  // Insert all other roster members
  roster.forEach((member, index) => {
    if (member.walletAddress.toUpperCase() === creatorAddress.toUpperCase()) {
      return; // Already added as creator
    }

    const payoutItem = payoutOrder.find((p) => p.walletAddress.toUpperCase() === member.walletAddress.toUpperCase());
    const payoutRound = payoutItem ? payoutItem.payoutRound : index + 2;
    const resolvedProfileId = profileMap.get(member.walletAddress.trim().toUpperCase()) || null;

    membersToInsert.push({
      circle_id: circle.id,
      profile_id: resolvedProfileId,
      display_name: member.displayName.trim(),
      wallet_address: member.walletAddress.trim().toUpperCase(),
      role: "member",
      invite_status: "invited",
      agreement_status: "pending",
      collateral_status: "not_posted",
      payment_status: "pending",
      payout_round: payoutRound,
      restriction_status: "clear",
    });
  });

  const { error: membersError } = await supabase
    .from("circle_members")
    .insert(membersToInsert);

  if (membersError) {
    console.error("Members insert error:", membersError);
    // clean up created circle on failure
    await supabase.from("circles").delete().eq("id", circle.id);
    return { success: false, error: membersError.message };
  }

  // 3. Insert invite notifications for members who have accounts
  const { data: insertedMembers } = await supabase
    .from("circle_members")
    .select("id, profile_id")
    .eq("circle_id", circle.id);

  if (insertedMembers) {
    const currentUserId = authContext.user.id;
    const notificationsToInsert = insertedMembers
      .filter((m) => m.profile_id && m.profile_id !== currentUserId)
      .map((m) => ({
        circle_id: circle.id,
        profile_id: m.profile_id,
        member_id: m.id,
        notification_type: "invite",
        title: "Savings Circle Invitation",
        body: `You have been invited to join the rotating savings circle "${basics.name}". Click to accept and deposit collateral.`,
      }));

    if (notificationsToInsert.length > 0) {
      await supabase
        .from("member_notifications")
        .insert(notificationsToInsert);
    }
  }

  // Revalidate the dashboard paths so the sidebar updates
  revalidatePath("/dashboard", "layout");

  return { success: true, circleId: circle.id };
}


export async function completeOnboarding() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);

  revalidatePath("/dashboard", "layout");
}


export async function pauseCircleAction(circleId: string, reason: string) {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabaseClient();

  // Verify user is the creator
  const { data: circle } = await supabase
    .from("circles")
    .select("id, creator_id, status")
    .eq("id", circleId)
    .single();

  if (!circle || circle.creator_id !== authContext.user.id) {
    return { success: false, error: "Only the circle creator can pause the circle." };
  }

  if (circle.status !== "active" && circle.status !== "delayed") {
    return { success: false, error: "Only active or delayed circles can be paused." };
  }

  const { error } = await supabase
    .from("circles")
    .update({ status: "paused" })
    .eq("id", circleId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Log the pause event
  await supabase.from("audit_events").insert({
    circle_id: circleId,
    event_type: "circle_paused",
    member_id: null,
    metadata: { reason: reason.trim() },
  });

  revalidatePath(`/dashboard/${circleId}`);
  revalidatePath("/dashboard", "layout");

  return { success: true };
}

export async function resumeCircleAction(circleId: string) {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabaseClient();

  const { data: circle } = await supabase
    .from("circles")
    .select("id, creator_id, status")
    .eq("id", circleId)
    .single();

  if (!circle || circle.creator_id !== authContext.user.id) {
    return { success: false, error: "Only the circle creator can resume the circle." };
  }

  if (circle.status !== "paused") {
    return { success: false, error: "Only paused circles can be resumed." };
  }

  const { error } = await supabase
    .from("circles")
    .update({ status: "active" })
    .eq("id", circleId);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    circle_id: circleId,
    event_type: "circle_resumed",
    member_id: null,
  });

  revalidatePath(`/dashboard/${circleId}`);
  revalidatePath("/dashboard", "layout");

  return { success: true };
}

export async function cancelCircleAction(circleId: string, reason: string, txHash?: string) {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabaseClient();

  const { data: circle } = await supabase
    .from("circles")
    .select("id, creator_id, status")
    .eq("id", circleId)
    .single();

  if (!circle || circle.creator_id !== authContext.user.id) {
    return { success: false, error: "Only the circle creator can cancel the circle." };
  }

  if (circle.status !== "pending" && circle.status !== "draft") {
    return { success: false, error: "Only pending or draft circles can be cancelled." };
  }

  const { error } = await supabase
    .from("circles")
    .update({ status: "cancelled" })
    .eq("id", circleId);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    circle_id: circleId,
    event_type: "circle_cancelled",
    member_id: null,
    tx_hash: txHash || null,
    metadata: { reason: reason.trim() },
  });

  revalidatePath(`/dashboard/${circleId}`);
  revalidatePath("/dashboard", "layout");

  return { success: true };
}

export async function resolveUserByUsernameAction(username: string) {
  const authContext = await requireAuthenticatedUser("/dashboard/create");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const cleanUsername = username.replace(/^@/, "").trim();
  if (!/^\d{6}$/.test(cleanUsername)) {
    return { success: false, error: "User ID must be six digits." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, wallet_address")
    .eq("username", cleanUsername)
    .maybeSingle();

  if (error || !profile) {
    return { success: false, error: "User ID not found." };
  }

  return {
    success: true,
    displayName: profile.full_name || cleanUsername,
    walletAddress: profile.wallet_address || null,
  };
}

export async function resolveUserByWalletAction(walletAddress: string) {
  const authContext = await requireAuthenticatedUser("/dashboard/create");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const cleanWallet = walletAddress.trim().toUpperCase();
  if (!StrKey.isValidEd25519PublicKey(cleanWallet)) {
    return { success: false, error: "Enter a valid Stellar account address." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("wallet_address", cleanWallet)
    .maybeSingle();

  if (error || !profile) {
    return { success: false, error: "Wallet not found in profiles." };
  }

  return {
    success: true,
    displayName: profile.full_name || `@${profile.username}`,
    username: profile.username,
  };
}

export async function updateProfileWalletAction(walletAddress: string) {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const cleanWallet = walletAddress.trim().toUpperCase();
  if (!StrKey.isValidEd25519PublicKey(cleanWallet)) {
    return { success: false, error: "Enter a valid Stellar account address." };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("profiles")
    .update({ wallet_address: cleanWallet })
    .eq("id", authContext.user.id);

  if (error) {
    console.error("Failed to update profile wallet:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function acceptAgreementAction(
  circleId: string,
  notificationId: string | undefined,
  txHash: string
) {
  const authContext = await requireAuthenticatedUser(`/dashboard/${circleId}/agreement`);
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabaseClient();
  const { data: member } = await supabase
    .from("circle_members")
    .select("id, invite_status, wallet_address, circles(collateral_amount, contribution_asset)")
    .eq("circle_id", circleId)
    .eq("profile_id", authContext.user.id)
    .eq("role", "member")
    .maybeSingle();

  if (!member || member.invite_status !== "invited") {
    return { success: false, error: "No pending invitation found for this circle." };
  }
  if (!env.contractId) {
    return { success: false, error: "NEXT_PUBLIC_CIRCULO_CONTRACT_ID is not configured." };
  }

  const circle = Array.isArray(member.circles) ? member.circles[0] : member.circles;
  if (!circle) {
    return { success: false, error: "Circle configuration was not found." };
  }

  try {
    const tokenContractId = getTokenContractId(circle.contribution_asset);
    const amount = BigInt(
      Math.round(Number(circle.collateral_amount) * 10_000_000)
    );
    await verifyContributeTransaction(
      txHash,
      member.wallet_address,
      env.contractId,
      circleId,
      tokenContractId,
      amount.toString()
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Testnet transaction verification failed.",
    };
  }

  const { error } = await supabase.rpc("accept_circle_invitation", {
    target_circle_id: circleId,
    target_notification_id: notificationId ?? null,
    transaction_hash: txHash,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/${circleId}`);
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

/**
 * Records the creator's separate, wallet-signed collateral deposit. The
 * creator is already an accepted roster member, so they do not use the member
 * invitation acceptance flow above.
 */
export async function confirmCreatorCollateralAction(circleId: string, txHash: string) {
  const authContext = await requireAuthenticatedUser(`/dashboard/${circleId}`);
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  if (!env.contractId) {
    return { success: false, error: "NEXT_PUBLIC_CIRCULO_CONTRACT_ID is not configured." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: member } = await supabase
    .from("circle_members")
    .select("id, wallet_address, collateral_status, circles(contribution_asset)")
    .eq("circle_id", circleId)
    .eq("profile_id", authContext.user.id)
    .eq("role", "creator")
    .maybeSingle();

  if (!member) {
    return { success: false, error: "Only this circle's creator can post its creator collateral." };
  }
  if (member.collateral_status === "posted") {
    return { success: false, error: "Creator collateral has already been posted." };
  }

  const circle = Array.isArray(member.circles) ? member.circles[0] : member.circles;
  if (!circle) {
    return { success: false, error: "Circle configuration was not found." };
  }

  try {
    await verifyContributeTransaction(
      txHash,
      member.wallet_address,
      env.contractId,
      circleId,
      getTokenContractId(circle.contribution_asset)
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Collateral transaction verification failed.",
    };
  }

  const { error: updateError } = await supabase
    .from("circle_members")
    .update({ collateral_status: "posted" })
    .eq("id", member.id)
    .eq("collateral_status", "not_posted");

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  await supabase.from("audit_events").insert({
    circle_id: circleId,
    member_id: member.id,
    event_type: "collateral_posted",
    tx_hash: txHash,
    metadata: { role: "creator" },
  });

  revalidatePath(`/dashboard/${circleId}`);
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

/**
 * Reconciles a member's wallet-signed contribution with the dashboard state.
 * The contract is the source of truth for the transfer; this action only
 * records a successful, matching transaction after RPC verification. The
 * conditional update makes retries safe when a wallet or browser submits the
 * confirmation more than once.
 */
export async function recordContributionPaymentAction(circleId: string, txHash: string) {
  const authContext = await requireAuthenticatedUser(`/dashboard/${circleId}`);
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }
  if (!env.contractId) {
    return { success: false, error: "NEXT_PUBLIC_CIRCULO_CONTRACT_ID is not configured." };
  }
  if (!/^[0-9a-fA-F]{64}$/.test(txHash)) {
    return { success: false, error: "A valid on-chain transaction hash is required." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: circle } = await supabase
    .from("circles")
    .select("id, status, current_round, contribution_asset")
    .eq("id", circleId)
    .maybeSingle();
  if (!circle) return { success: false, error: "Circle not found." };
  if (circle.status !== "active") {
    return { success: false, error: "Contributions can only be verified for an active circle." };
  }

  const { data: member } = await supabase
    .from("circle_members")
    .select("id, wallet_address")
    .eq("circle_id", circleId)
    .eq("profile_id", authContext.user.id)
    .maybeSingle();
  if (!member) return { success: false, error: "You are not a member of this circle." };

  const { data: round } = await supabase
    .from("circle_rounds")
    .select("id, round_number, due_at")
    .eq("circle_id", circleId)
    .eq("round_number", circle.current_round)
    .maybeSingle();
  if (!round) return { success: false, error: "The current round was not found." };

  const { data: contribution } = await supabase
    .from("circle_contributions")
    .select("id, amount_due, status, paid_at, tx_hash")
    .eq("circle_id", circleId)
    .eq("round_id", round.id)
    .eq("member_id", member.id)
    .maybeSingle();
  if (!contribution) return { success: false, error: "No contribution is scheduled for this round." };
  if (contribution.status === "paid") {
    return { success: true, alreadyRecorded: true, hash: contribution.tx_hash ?? txHash };
  }

  try {
    await verifyContributeTransaction(
      txHash,
      member.wallet_address,
      env.contractId,
      circleId,
      getTokenContractId(circle.contribution_asset),
      contribution.amount_due,
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Contribution verification failed.",
    };
  }

  const paidAt = new Date().toISOString();
  const { data: updatedContribution, error: updateError } = await supabase
    .from("circle_contributions")
    .update({ status: "paid", tx_hash: txHash, paid_at: paidAt })
    .eq("id", contribution.id)
    .neq("status", "paid")
    .select("id")
    .maybeSingle();
  if (updateError) return { success: false, error: updateError.message };

  // If another retry won the race, the desired final state is already true.
  if (!updatedContribution) {
    return { success: true, alreadyRecorded: true, hash: txHash };
  }

  const { data: paidContributions } = await supabase
    .from("circle_contributions")
    .select("amount_due")
    .eq("round_id", round.id)
    .eq("status", "paid");
  const collectedAmount = (paidContributions ?? []).reduce(
    (total, item) => total + Number(item.amount_due ?? 0),
    0,
  );
  await supabase
    .from("circle_rounds")
    .update({ collected_amount: collectedAmount, status: "active" })
    .eq("id", round.id);

  await supabase.from("audit_events").insert({
    circle_id: circleId,
    member_id: member.id,
    event_type: "contribution_verified",
    round_number: round.round_number,
    tx_hash: txHash,
    metadata: {
      amount: Number(contribution.amount_due),
      asset: circle.contribution_asset,
      due_at: round.due_at,
      paid_at: paidAt,
      status: "paid",
    },
  });

  revalidatePath(`/dashboard/${circleId}`);
  revalidatePath(`/dashboard/${circleId}/calendar`);
  return { success: true, hash: txHash };
}


export async function activateCircleAction(circleId: string) {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabaseClient();

  // 1. Verify user is the creator
  const { data: circle } = await supabase
    .from("circles")
    .select("id, creator_id, status, cycle_count, interval_seconds, contribution_amount, contribution_asset, settings_locked, payout_order_locked, rules_locked")
    .eq("id", circleId)
    .single();

  if (!circle) {
    return { success: false, error: "Circle not found." };
  }

  if (circle.creator_id !== authContext.user.id) {
    return { success: false, error: "Only the circle creator can activate." };
  }

  if (circle.status !== "draft") {
    return { success: false, error: "Only draft circles can be activated." };
  }

  // 2. A cycle starts only with members who are fully ready: invite accepted,
  //    agreement accepted, and collateral validated/posted.
  const { data: members } = await supabase
    .from("circle_members")
    .select("id, payout_round, invite_status, collateral_status, agreement_status")
    .eq("circle_id", circleId);

  if (!members || members.length === 0) {
    return { success: false, error: "Circle has no members." };
  }

  const readyMembers = members.filter(
    (m) =>
      m.invite_status === "accepted" &&
      m.agreement_status === "accepted" &&
      m.collateral_status === "posted"
  );
  const minimumMembersRequired = Math.min(MIN_CYCLE_MEMBERS, members.length);

  if (readyMembers.length < minimumMembersRequired) {
    return {
      success: false,
      error: `A cycle needs at least ${minimumMembersRequired} members with validated collateral. Only ${readyMembers.length} ready so far.`,
    };
  }

  // Every member currently present must be validated before the cycle starts.
  const pendingMembers = members.filter(
    (m) =>
      m.invite_status !== "accepted" ||
      m.agreement_status !== "accepted" ||
      m.collateral_status !== "posted"
  );
  if (pendingMembers.length > 0) {
    return {
      success: false,
      error: `${pendingMembers.length} member${pendingMembers.length > 1 ? "s have" : " has"} not validated collateral yet. All present members must be validated to start the cycle.`,
    };
  }

  // 3. All gates pass — lock the participating roster for every configured
  //    rotation. Members added later join a future agreement.
  const { error: updateError } = await supabase
    .from("circles")
    .update({
      status: "active",
      current_round: 1,
      total_rounds: readyMembers.length * Number(circle.cycle_count ?? 1),
      member_count: readyMembers.length,
      start_date: new Date().toISOString(),
      settings_locked: true,
      payout_order_locked: true,
      rules_locked: true,
    })
    .eq("id", circleId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Materialize the complete schedule once, at activation time. This gives
  // the member dashboard a stable due date for every round and lets the cron
  // worker claim only the current payout row. The original due date is never
  // replaced by the eventual payment timestamp.
  const cycleCount = Number(circle.cycle_count ?? 1);
  const totalRounds = readyMembers.length * cycleCount;
  const startAt = new Date();
  const roundsToInsert = Array.from({ length: totalRounds }, (_, index) => {
    const roundNumber = index + 1;
    const dueAt = new Date(
      startAt.getTime() + index * Number(circle.interval_seconds) * 1000,
    );
    const payoutPosition = ((roundNumber - 1) % readyMembers.length) + 1;
    const payoutMember = readyMembers.find((member) => member.payout_round === payoutPosition);
    return {
      circle_id: circleId,
      round_number: roundNumber,
      due_at: dueAt.toISOString(),
      payout_member_id: payoutMember?.id ?? null,
      expected_amount: Number(circle.contribution_amount) * readyMembers.length,
      collected_amount: 0,
      status: roundNumber === 1 ? "active" : "scheduled",
    };
  });

  const { data: insertedRounds, error: roundsError } = await supabase
    .from("circle_rounds")
    .insert(roundsToInsert)
    .select("id, round_number, due_at, payout_member_id");
  if (roundsError || !insertedRounds) {
    return { success: false, error: roundsError?.message ?? "Could not create circle rounds." };
  }

  const contributionsToInsert = insertedRounds.flatMap((round) =>
    readyMembers.map((member) => ({
      circle_id: circleId,
      round_id: round.id,
      member_id: member.id,
      amount_due: Number(circle.contribution_amount),
      status: round.round_number === 1 ? "due_now" : "pending",
    })),
  );
  const { error: contributionsError } = await supabase
    .from("circle_contributions")
    .insert(contributionsToInsert);
  if (contributionsError) {
    return { success: false, error: contributionsError.message };
  }

  const payoutsToInsert = insertedRounds.map((round) => ({
    circle_id: circleId,
    round_number: round.round_number,
    recipient_member_id: round.payout_member_id,
    payout_amount: Number(circle.contribution_amount) * readyMembers.length,
    expected_payout_at: round.due_at,
    status: round.round_number === 1 ? "ready" : "scheduled",
  }));
  const { error: payoutsError } = await supabase
    .from("payout_schedule")
    .insert(payoutsToInsert);
  if (payoutsError) {
    return { success: false, error: payoutsError.message };
  }

  // 5. Log the activation event
  await supabase.from("audit_events").insert({
    circle_id: circleId,
    event_type: "circle_activated",
    member_id: null,
  });

  revalidatePath(`/dashboard/${circleId}`);
  revalidatePath("/dashboard", "layout");

  return { success: true };
}

export async function logCircleInitializationAction(circleId: string, txHash: string) {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("audit_events").insert({
    circle_id: circleId,
    event_type: "initialize",
    tx_hash: txHash,
    metadata: { initialized_by: authContext.user.id },
  });

  if (error) {
    console.error("Initialization log error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function logCollateralRefundAction(circleId: string, memberAddress: string, txHash: string) {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabaseClient();

  const { data: member } = await supabase
    .from("circle_members")
    .select("id")
    .eq("circle_id", circleId)
    .eq("wallet_address", memberAddress)
    .single();

  if (!member) {
    return { success: false, error: "Member not found" };
  }

  const { error: updateError } = await supabase
    .from("circle_members")
    .update({ collateral_status: "not_posted" })
    .eq("id", member.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  await supabase.from("audit_events").insert({
    circle_id: circleId,
    member_id: member.id,
    event_type: "collateral_refunded",
    tx_hash: txHash,
  });

  revalidatePath(`/dashboard/${circleId}`);
  return { success: true };
}

export async function deleteCircleAction(circleId: string) {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabaseClient();

  const { data: circle } = await supabase
    .from("circles")
    .select("creator_id, status")
    .eq("id", circleId)
    .single();

  if (!circle) {
    return { success: false, error: "Circle not found" };
  }

  if (circle.creator_id !== authContext.user.id) {
    return { success: false, error: "Only the creator can delete this circle" };
  }

  if (circle.status !== "cancelled" && circle.status !== "draft") {
    return { success: false, error: "Only cancelled or draft circles can be deleted" };
  }

  // Delete all dependencies explicitly to prevent foreign key constraint issues
  await supabase.from("audit_events").delete().eq("circle_id", circleId);
  await supabase.from("member_notifications").delete().eq("circle_id", circleId);
  await supabase.from("payout_schedule").delete().eq("circle_id", circleId);
  await supabase.from("circle_contributions").delete().eq("circle_id", circleId);
  await supabase.from("circle_rounds").delete().eq("circle_id", circleId);
  await supabase.from("circle_members").delete().eq("circle_id", circleId);

  const { error } = await supabase
    .from("circles")
    .delete()
    .eq("id", circleId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function recordCollateralSlashAction(
  circleId: string,
  memberId: string,
  slashedAmount: number,
  txHash: string
) {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  if (!/^[0-9a-fA-F]{64}$/.test(txHash)) {
    return { success: false, error: "A valid on-chain transaction hash is required." };
  }
  if (!Number.isFinite(slashedAmount) || slashedAmount < 0) {
    return { success: false, error: "Slashed amount is invalid." };
  }

  const supabase = await createServerSupabaseClient();

  // Only the circle creator may record a slash.
  const { data: circle } = await supabase
    .from("circles")
    .select("id, creator_id, status")
    .eq("id", circleId)
    .single();

  if (!circle || circle.creator_id !== authContext.user.id) {
    return { success: false, error: "Only the circle creator can slash collateral." };
  }
  if (circle.status !== "active" && circle.status !== "delayed") {
    return { success: false, error: "Collateral can only be slashed on an active circle." };
  }

  const { data: member } = await supabase
    .from("circle_members")
    .select("id, slashed_amount")
    .eq("id", memberId)
    .eq("circle_id", circleId)
    .maybeSingle();

  if (!member) {
    return { success: false, error: "Member not found in this circle." };
  }

  const priorSlashed = Number(member.slashed_amount ?? 0);
  const { error: updateError } = await supabase
    .from("circle_members")
    .update({
      collateral_status: "partially_slashed",
      restriction_status: "warning",
      slashed_amount: priorSlashed + slashedAmount,
    })
    .eq("id", member.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  await supabase.from("audit_events").insert({
    circle_id: circleId,
    member_id: member.id,
    event_type: "collateral_slashed",
    tx_hash: txHash,
    metadata: { slashed_amount: slashedAmount },
  });

  revalidatePath(`/dashboard/${circleId}`);
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function recordRoundPayoutAction(
  circleId: string,
  recipientMemberId: string,
  txHash: string
) {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  if (!/^[0-9a-fA-F]{64}$/.test(txHash)) {
    return { success: false, error: "A valid on-chain transaction hash is required." };
  }

  const supabase = await createServerSupabaseClient();

  const { data: circle } = await supabase
    .from("circles")
    .select("id, creator_id, status, current_round, total_rounds")
    .eq("id", circleId)
    .single();

  if (!circle || circle.creator_id !== authContext.user.id) {
    return { success: false, error: "Only the circle creator can record a payout." };
  }
  if (circle.status !== "active") {
    return { success: false, error: "Payouts can only be recorded on an active circle." };
  }

  const round = circle.current_round;
  const isFinalRound = round >= circle.total_rounds;

  // Mark the payout schedule row for this round as paid.
  await supabase
    .from("payout_schedule")
    .update({ status: "paid", tx_hash: txHash })
    .eq("circle_id", circleId)
    .eq("round_number", round);

  // Mark the round as paid.
  await supabase
    .from("circle_rounds")
    .update({ status: "paid" })
    .eq("circle_id", circleId)
    .eq("round_number", round);

  // Advance the circle, or complete it after the final round. This mirrors the
  // on-chain round progression in execute_payout.
  const { error: updateError } = await supabase
    .from("circles")
    .update(
      isFinalRound
        ? { status: "completed" }
        : { current_round: round + 1 }
    )
    .eq("id", circleId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  await supabase.from("audit_events").insert({
    circle_id: circleId,
    member_id: recipientMemberId,
    event_type: isFinalRound ? "circle_completed" : "payout_released",
    round_number: round,
    tx_hash: txHash,
    metadata: { round },
  });

  revalidatePath(`/dashboard/${circleId}`);
  revalidatePath("/dashboard", "layout");
  return { success: true, completed: isFinalRound };
}

export async function markNotificationReadAction(notificationId: string) {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("member_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("profile_id", authContext.user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("member_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("profile_id", authContext.user.id)
    .is("read_at", null);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function proposeDeleteCircleAction(circleId: string, memberId: string) {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabaseClient();
  
  // Create an audit event for the proposal
  const { error } = await supabase.from("audit_events").insert({
    circle_id: circleId,
    member_id: memberId,
    event_type: "delete_proposed",
    metadata: { status: "pending" },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Also auto-vote for the proposer
  await supabase.from("audit_events").insert({
    circle_id: circleId,
    member_id: memberId,
    event_type: "delete_voted",
    metadata: { vote: "approve" },
  });

  revalidatePath(`/dashboard/${circleId}`);
  return { success: true };
}

export async function voteDeleteCircleAction(circleId: string, memberId: string, vote: "approve" | "reject") {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabaseClient();
  
  const { error } = await supabase.from("audit_events").insert({
    circle_id: circleId,
    member_id: memberId,
    event_type: "delete_voted",
    metadata: { vote },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/${circleId}`);
  return { success: true };
}
