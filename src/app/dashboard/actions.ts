"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/auth";

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

  // Self-healing check for user profile presence
  const { data: existingProfile, error: profileCheckError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", authContext.user.id)
    .maybeSingle();

  if (profileCheckError) {
    console.error("Profile check error:", profileCheckError);
  }

  if (!existingProfile) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not defined");
      return { success: false, error: "Failed to initialize user profile. System configuration error." };
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { error: profileInsertError } = await adminSupabase
      .from("profiles")
      .insert({
        id: authContext.user.id,
        email: authContext.user.email || "",
        full_name: authContext.user.user_metadata?.full_name || authContext.user.email?.split("@")[0] || "Ari Santos",
      });

    if (profileInsertError) {
      console.error("Profile auto-insert error:", profileInsertError);
      return { success: false, error: "Failed to initialize user profile: " + profileInsertError.message };
    }
  }

  // Resolve the creator's wallet address (connected wallet or fallback format-compliant key)
  const creatorAddress = creatorWalletAddress || "GAAAABBBCCCDDDEEEFFFGGGHHHIIIJJJKKKLLLMMMNNOOOPPPQQQRRR2";

  // Check if the creator is explicitly listed in the roster
  const creatorIndex = roster.findIndex((m) => m.walletAddress.toUpperCase() === creatorAddress.toUpperCase());
  const hasCreator = creatorIndex !== -1;
  const actualMemberCount = hasCreator ? roster.length : roster.length + 1;

  // 1. Insert the circle into the public.circles table
  const { data: circle, error: circleError } = await supabase
    .from("circles")
    .insert({
      creator_id: authContext.user.id,
      name: basics.name,
      status: "draft",
      contribution_amount: basics.contributionAmount,
      contribution_asset: basics.contributionAsset,
      interval_seconds: basics.intervalSeconds,
      member_count: actualMemberCount, // exact count matching the roster + creator
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

  // Insert the creator (either mapped from the roster or manually)
  if (hasCreator) {
    const creatorMember = roster[creatorIndex];
    const payoutItem = payoutOrder.find((p) => p.walletAddress.toUpperCase() === creatorMember.walletAddress.toUpperCase());
    const payoutRound = payoutItem ? payoutItem.payoutRound : 1;

    membersToInsert.push({
      circle_id: circle.id,
      profile_id: authContext.user.id,
      display_name: creatorMember.displayName,
      wallet_address: creatorMember.walletAddress,
      role: "creator",
      invite_status: "accepted",
      agreement_status: "accepted",
      collateral_status: "not_posted",
      payment_status: "not_due",
      payout_round: payoutRound,
      restriction_status: "clear",
    });
  } else {
    membersToInsert.push({
      circle_id: circle.id,
      profile_id: authContext.user.id,
      display_name: authContext.profile?.full_name || authContext.user.email || "Ari Santos",
      wallet_address: creatorAddress,
      role: "creator",
      invite_status: "accepted",
      agreement_status: "accepted",
      collateral_status: "not_posted",
      payment_status: "not_due",
      payout_round: 1,
      restriction_status: "clear",
    });
  }

  // Insert all other roster members
  roster.forEach((member, index) => {
    if (member.walletAddress.toUpperCase() === creatorAddress.toUpperCase()) {
      return; // Already added as creator
    }

    const payoutItem = payoutOrder.find((p) => p.walletAddress.toUpperCase() === member.walletAddress.toUpperCase());
    const payoutRound = payoutItem ? payoutItem.payoutRound : index + 2;

    membersToInsert.push({
      circle_id: circle.id,
      display_name: member.displayName,
      wallet_address: member.walletAddress,
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
    details: reason,
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

export async function cancelCircleAction(circleId: string, reason: string) {
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
    details: reason,
  });

  revalidatePath(`/dashboard/${circleId}`);
  revalidatePath("/dashboard", "layout");

  return { success: true };
}

export async function resolveUserByUsernameAction(username: string) {
  const supabase = await createServerSupabaseClient();
  
  // Clean username input (trim and remove leading @ if present)
  const cleanUsername = username.replace(/^@/, "").trim();
  
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
    walletAddress: profile.wallet_address || null 
  };
}

export async function updateProfileWalletAction(walletAddress: string) {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("profiles")
    .update({ wallet_address: walletAddress })
    .eq("id", authContext.user.id);

  if (error) {
    console.error("Failed to update profile wallet:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function acceptAgreementAction(circleId: string) {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabaseClient();

  // Find user's member record in this circle
  let { data: member } = await supabase
    .from("circle_members")
    .select("id, invite_status")
    .eq("circle_id", circleId)
    .eq("profile_id", authContext.user.id)
    .maybeSingle();

  if (!member) {
    // Try matching by email
    const { data: memberByEmail } = await supabase
      .from("circle_members")
      .select("id, invite_status")
      .eq("circle_id", circleId)
      .eq("display_name", authContext.profile?.full_name || authContext.user.email || "")
      .maybeSingle();
    
    if (memberByEmail) {
      member = memberByEmail;
    }
  }

  if (!member) {
    // Try matching by first pending invite for testing
    const { data: invited } = await supabase
      .from("circle_members")
      .select("id, invite_status")
      .eq("circle_id", circleId)
      .eq("invite_status", "invited")
      .limit(1);
    
    if (invited && invited.length > 0) {
      member = invited[0];
    }
  }

  if (!member) {
    return { success: false, error: "No pending invitation found for this circle." };
  }

  const { error: updateError } = await supabase
    .from("circle_members")
    .update({
      profile_id: authContext.user.id,
      invite_status: "accepted",
      agreement_status: "accepted",
      collateral_status: "posted",
    })
    .eq("id", member.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Check if all members accepted
  const { data: allMembers } = await supabase
    .from("circle_members")
    .select("invite_status")
    .eq("circle_id", circleId);

  const allAccepted = allMembers && allMembers.every((m) => m.invite_status === "accepted");

  if (allAccepted) {
    await supabase
      .from("circles")
      .update({ status: "active", current_round: 1 })
      .eq("id", circleId);

    await supabase.from("audit_events").insert({
      circle_id: circleId,
      event_type: "circle_resumed",
      details: "All participants accepted. Circle activated automatically.",
    });
  }

  revalidatePath(`/dashboard/${circleId}`);
  revalidatePath("/dashboard", "layout");

  return { success: true };
}
