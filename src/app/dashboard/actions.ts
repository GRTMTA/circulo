"use server";

import { revalidatePath } from "next/cache";

import { StrKey } from "@stellar/stellar-sdk";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getTokenContractId, env } from "@/lib/env";
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
  intervalSeconds: number;
  memberCount: number;
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
      interval_seconds: basics.intervalSeconds,
      member_count: actualMemberCount, // current roster size (can grow up to the max)
      max_member_count: basics.memberCount,
      collateral_amount: collateral.collateralAmount,
      grace_period_hours: collateral.gracePeriodHours,
      slash_percentage: collateral.slashPercentage,
      current_round: 0, // 0 for draft mode (not started)
      total_rounds: actualMemberCount,
      start_date: null,
      settings_locked: false,
      payout_order_locked: false,
      rules_locked: false,
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

  if (circle.status !== "paused" && circle.status !== "draft") {
    return { success: false, error: "Only paused or draft circles can be cancelled. Pause the circle first." };
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


export async function activateCircleAction(circleId: string) {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabaseClient();

  // 1. Verify user is the creator
  const { data: circle } = await supabase
    .from("circles")
    .select("id, creator_id, status, settings_locked, payout_order_locked, rules_locked")
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

  // 2. Check all settings are locked
  if (!circle.settings_locked || !circle.payout_order_locked || !circle.rules_locked) {
    return { success: false, error: "Lock all settings, payout order, and rules before activation." };
  }

  // 3. A cycle starts only with members who are fully ready: invite accepted,
  //    agreement accepted, and collateral validated/posted.
  const { data: members } = await supabase
    .from("circle_members")
    .select("id, invite_status, collateral_status, agreement_status")
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

  if (readyMembers.length < MIN_CYCLE_MEMBERS) {
    return {
      success: false,
      error: `A cycle needs at least ${MIN_CYCLE_MEMBERS} members with validated collateral. Only ${readyMembers.length} ready so far.`,
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

  // 4. All gates pass — activate the circle. Rounds equal the participating
  //    members captured at activation; members added later join a future cycle.
  const { error: updateError } = await supabase
    .from("circles")
    .update({
      status: "active",
      current_round: 1,
      total_rounds: readyMembers.length,
      member_count: readyMembers.length,
      start_date: new Date().toISOString(),
    })
    .eq("id", circleId);

  if (updateError) {
    return { success: false, error: updateError.message };
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
  await supabase.from("notifications").delete().eq("circle_id", circleId);
  await supabase.from("contributions").delete().eq("circle_id", circleId);
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
