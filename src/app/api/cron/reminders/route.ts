import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Cron endpoint for sending contribution reminders.
 *
 * This should be triggered by an external scheduler (e.g., Vercel Cron, GitHub Actions)
 * at regular intervals (every 30 minutes recommended).
 *
 * It checks all active circles for upcoming contribution deadlines and creates
 * notification records for members who haven't paid yet.
 *
 * Security: Protected by CRON_SECRET header check.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase configuration" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date();
  let remindersCreated = 0;

  // 1. Get all active circles with their reminder schedule
  const { data: circles, error: circlesError } = await supabase
    .from("circles")
    .select("id, name, reminder_schedule_hours, contribution_amount, contribution_asset")
    .eq("status", "active");

  if (circlesError || !circles) {
    return NextResponse.json(
      { error: circlesError?.message ?? "Failed to fetch circles" },
      { status: 500 }
    );
  }

  for (const circle of circles) {
    const scheduleHours: number[] = circle.reminder_schedule_hours ?? [24, 1];

    // 2. Get current active round with a due date
    const { data: rounds } = await supabase
      .from("circle_rounds")
      .select("id, round_number, due_at")
      .eq("circle_id", circle.id)
      .in("status", ["active", "scheduled"])
      .not("due_at", "is", null)
      .order("round_number", { ascending: true })
      .limit(1);

    if (!rounds || rounds.length === 0) continue;

    const round = rounds[0];
    const dueAt = new Date(round.due_at);
    const hoursUntilDue = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Skip if due date is in the past
    if (hoursUntilDue < 0) continue;

    // 3. Determine which reminder tier applies now
    // scheduleHours is sorted descending (e.g., [24, 1])
    // We find the largest threshold that the current time has crossed
    const sortedSchedule = [...scheduleHours].sort((a, b) => b - a);
    let reminderTier: number | null = null;

    for (const threshold of sortedSchedule) {
      if (hoursUntilDue <= threshold) {
        reminderTier = threshold;
        break;
      }
    }

    if (reminderTier === null) continue;

    // 4. Get members who haven't paid for this round
    const { data: contributions } = await supabase
      .from("circle_contributions")
      .select("member_id, status, reminders_sent")
      .eq("round_id", round.id)
      .not("status", "in", '("paid","verifying")');

    if (!contributions || contributions.length === 0) continue;

    // 5. Get member details for notification insertion
    const memberIds = contributions.map((c) => c.member_id);
    const { data: members } = await supabase
      .from("circle_members")
      .select("id, profile_id, display_name")
      .in("id", memberIds)
      .not("profile_id", "is", null);

    if (!members || members.length === 0) continue;

    // 6. Create notifications for members who haven't received this tier's reminder
    const tierIndex = sortedSchedule.indexOf(reminderTier);
    const requiredReminders = tierIndex + 1;

    const notificationsToInsert = [];

    for (const member of members) {
      const contribution = contributions.find((c) => c.member_id === member.id);
      if (!contribution) continue;

      // Skip if this member already received enough reminders for this tier
      if (contribution.reminders_sent >= requiredReminders) continue;

      const notificationType =
        hoursUntilDue <= 1
          ? "contribution_due_now"
          : "contribution_due_soon";

      const title =
        hoursUntilDue <= 1
          ? `Contribution due now`
          : `Contribution due in ${Math.ceil(hoursUntilDue)} hours`;

      const body = `Your ${circle.contribution_amount} ${circle.contribution_asset} contribution for ${circle.name} Round ${round.round_number} is ${hoursUntilDue <= 1 ? "due now" : `due in ${Math.ceil(hoursUntilDue)} hours`}. Pay on time to avoid collateral slashing.`;

      notificationsToInsert.push({
        circle_id: circle.id,
        profile_id: member.profile_id,
        member_id: member.id,
        notification_type: notificationType,
        title,
        body,
      });
    }

    if (notificationsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("member_notifications")
        .insert(notificationsToInsert);

      if (!insertError) {
        remindersCreated += notificationsToInsert.length;

        // Update reminders_sent count on contributions
        for (const member of members) {
          const contribution = contributions.find((c) => c.member_id === member.id);
          if (!contribution) continue;
          if (contribution.reminders_sent >= requiredReminders) continue;

          await supabase
            .from("circle_contributions")
            .update({ reminders_sent: requiredReminders })
            .eq("round_id", round.id)
            .eq("member_id", member.id);
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    remindersCreated,
    circlesProcessed: circles.length,
    timestamp: now.toISOString(),
  });
}
