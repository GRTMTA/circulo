"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/auth";

export interface CreateBasicsInput {
  name: string;
  contributionAmount: number;
  contributionAsset: "USDC" | "USDT";
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
  payoutOrder: CreatePayoutOrderItemInput[]
) {
  const authContext = await requireAuthenticatedUser("/dashboard/create");
  if (!authContext.configured || !authContext.user) {
    return { success: false, error: "Supabase not configured" };
  }

  const supabase = await createServerSupabaseClient();

  // Ensure the user's profile exists in public.profiles
  const { data: existingProfile, error: profileCheckError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", authContext.user.id)
    .maybeSingle();

  if (profileCheckError) {
    console.error("Profile check error:", profileCheckError);
  }

  if (!existingProfile) {
    const { error: profileInsertError } = await supabase
      .from("profiles")
      .insert({
        id: authContext.user.id,
        email: authContext.user.email || "",
        full_name: authContext.user.user_metadata?.full_name || authContext.user.email?.split("@")[0] || "Ari Santos",
      });

    if (profileInsertError) {
      console.error("Profile auto-insert error:", profileInsertError);
      return { success: false, error: "Failed to initialize user profile. Please try logging out and logging back in." };
    }
  }

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
      member_count: roster.length + 1, // roster members + creator
      max_member_count: basics.memberCount,
      collateral_amount: collateral.collateralAmount,
      grace_period_hours: collateral.gracePeriodHours,
      slash_percentage: collateral.slashPercentage,
      current_round: 0, // 0 for draft mode (not started)
      total_rounds: roster.length + 1,
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
  }> = [
    // The creator
    {
      circle_id: circle.id,
      profile_id: authContext.user.id,
      display_name: authContext.profile?.full_name || authContext.user.email || "Ari Santos",
      wallet_address: "GABC91A2CREATOR000000000000000000000000000000000000000001", // fallback wallet
      role: "creator",
      invite_status: "accepted",
      agreement_status: "accepted",
      collateral_status: "not_posted", // draft circles start with not_posted
      payment_status: "not_due",
      payout_round: 1,
      restriction_status: "clear",
    },
  ];

  // Invited members from the roster
  roster.forEach((member, index) => {
    // Find the payout round from the payoutOrder list
    const payoutItem = payoutOrder.find((p) => p.walletAddress === member.walletAddress);
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
