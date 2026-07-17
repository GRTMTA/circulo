import "server-only";

import { requireAuthenticatedUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CircleEnrichedDTO,
  CircleListItem,
  CircleStatus,
  CirclesDTO,
  CreatorDashboardDTO,
  DashboardAuditEvent,
  DashboardCircle,
  DashboardContribution,
  DashboardMember,
  DashboardNotification,
  DashboardPayout,
  DashboardRound,
  MemberDashboardDTO,
} from "@/lib/dashboard/types";

interface CircleRow {
  id: string;
  creator_id?: string;
  name: string;
  status: CircleStatus;
  contribution_amount: number | string;
  contribution_asset: string;
  cycle_count?: number;
  time_zone?: string;
  interval_seconds: number;
  member_count: number;
  max_member_count?: number;
  collateral_amount: number | string;
  grace_period_hours?: number;
  slash_percentage?: number;
  warning_threshold?: number;
  auto_slash_enabled?: boolean;
  payout_order_mode?: "creator" | "voting";
  reminder_schedule_hours?: number[];
  current_round: number;
  total_rounds: number;
  start_date: string | null;
  settings_locked: boolean;
  payout_order_locked: boolean;
  rules_locked: boolean;
}

interface MemberRow {
  id: string;
  profile_id: string | null;
  display_name: string;
  wallet_address: string;
  role: "creator" | "member";
  invite_status: DashboardMember["inviteStatus"];
  agreement_status: DashboardMember["agreementStatus"];
  collateral_status: DashboardMember["collateralStatus"];
  payment_status: DashboardMember["paymentStatus"];
  payout_round: number;
  restriction_status: DashboardMember["restrictionStatus"];
  late_count?: number;
  slashed_amount?: number | string;
  joined_at?: string | null;
}

interface ContributionRow {
  id: string;
  round_id: string;
  member_id: string;
  amount_due: number | string;
  status: DashboardContribution["status"];
  tx_hash: string | null;
  paid_at: string | null;
  slashed_amount?: number | string;
  slashed_at?: string | null;
  reminders_sent?: number;
}

interface PayoutRow {
  id: string;
  round_number: number;
  recipient_member_id: string | null;
  payout_amount?: number | string;
  expected_payout_at: string | null;
  withheld_amount?: number | string;
  status: DashboardPayout["status"];
  tx_hash: string | null;
  attempt_count?: number;
  last_error?: string | null;
  processed_at?: string | null;
}

interface RoundRow {
  id: string;
  round_number: number;
  due_at: string | null;
  payout_member_id: string | null;
  expected_amount: number | string;
  collected_amount: number | string;
  status: DashboardRound["status"];
}

interface AuditEventRow {
  id: string;
  member_id: string | null;
  event_type: string;
  round_number: number | null;
  tx_hash: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

interface NotificationRow {
  id: string;
  circle_id: string;
  notification_type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

function mapCircle(row: CircleRow): DashboardCircle {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    contributionAmount: toNumber(row.contribution_amount),
    contributionAsset: row.contribution_asset,
    cycleCount: row.cycle_count ?? 1,
    timeZone: row.time_zone ?? "Asia/Manila",
    intervalSeconds: row.interval_seconds,
    memberCount: row.member_count,
    maxMemberCount: row.max_member_count ?? 20,
    collateralAmount: toNumber(row.collateral_amount),
    gracePeriodHours: row.grace_period_hours ?? 4,
    slashPercentage: row.slash_percentage ?? 100,
    warningThreshold: row.warning_threshold ?? 2,
    autoSlashEnabled: row.auto_slash_enabled ?? true,
    payoutOrderMode: row.payout_order_mode ?? "creator",
    reminderScheduleHours: row.reminder_schedule_hours ?? [24, 1],
    currentRound: row.current_round,
    totalRounds: row.total_rounds,
    startDate: row.start_date,
    settingsLocked: row.settings_locked,
    payoutOrderLocked: row.payout_order_locked,
    rulesLocked: row.rules_locked,
  };
}

function mapMember(row: MemberRow): DashboardMember {
  return {
    id: row.id,
    profileId: row.profile_id,
    displayName: row.display_name,
    walletAddress: row.wallet_address,
    avatarUrl: null,
    role: row.role,
    inviteStatus: row.invite_status,
    agreementStatus: row.agreement_status,
    collateralStatus: row.collateral_status,
    paymentStatus: row.payment_status,
    payoutRound: row.payout_round,
    restrictionStatus: row.restriction_status,
    lateCount: row.late_count ?? 0,
    slashedAmount: row.slashed_amount ? toNumber(row.slashed_amount) : 0,
    joinedAt: row.joined_at ?? null,
  };
}

function mapRound(row: RoundRow): DashboardRound {
  return {
    id: row.id,
    roundNumber: row.round_number,
    dueAt: row.due_at,
    payoutMemberId: row.payout_member_id,
    expectedAmount: toNumber(row.expected_amount),
    collectedAmount: toNumber(row.collected_amount),
    status: row.status,
  };
}

function mapContribution(row: ContributionRow): DashboardContribution {
  return {
    id: row.id,
    roundId: row.round_id,
    memberId: row.member_id,
    amountDue: toNumber(row.amount_due),
    status: row.status,
    txHash: row.tx_hash,
    paidAt: row.paid_at,
    slashedAmount: row.slashed_amount ? toNumber(row.slashed_amount) : 0,
    slashedAt: row.slashed_at ?? null,
    remindersSent: row.reminders_sent ?? 0,
  };
}

function mapPayout(row: PayoutRow): DashboardPayout {
  return {
    id: row.id,
    roundNumber: row.round_number,
    recipientMemberId: row.recipient_member_id,
    payoutAmount: row.payout_amount ? toNumber(row.payout_amount) : 0,
    expectedPayoutAt: row.expected_payout_at,
    withheldAmount: row.withheld_amount ? toNumber(row.withheld_amount) : 0,
    status: row.status,
    txHash: row.tx_hash,
    attemptCount: row.attempt_count ?? 0,
    lastError: row.last_error ?? null,
    processedAt: row.processed_at ?? null,
  };
}

function mapAuditEvent(row: AuditEventRow): DashboardAuditEvent {
  const metadata = row.metadata ?? {};
  const numericAmount = typeof metadata.amount === "number" ? metadata.amount : undefined;
  return {
    id: row.id,
    eventType: row.event_type,
    memberId: row.member_id,
    roundNumber: row.round_number,
    txHash: row.tx_hash,
    createdAt: row.created_at,
    metadata,
    amount: numericAmount,
    asset: typeof metadata.asset === "string" ? metadata.asset : undefined,
    dueAt: typeof metadata.due_at === "string" ? metadata.due_at : null,
    paidAt: typeof metadata.paid_at === "string" ? metadata.paid_at : null,
    expectedPayoutAt:
      typeof metadata.expected_payout_at === "string" ? metadata.expected_payout_at : null,
    status: typeof metadata.status === "string" ? metadata.status : undefined,
  };
}

function mapNotification(row: NotificationRow): DashboardNotification {
  return {
    id: row.id,
    circleId: row.circle_id,
    notificationType: row.notification_type,
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

async function fetchCircleBundle(circleId: string) {
  const supabase = await createServerSupabaseClient();
  const [
    circleResult,
    membersResult,
    roundsResult,
    contributionsResult,
    payoutsResult,
    auditResult,
  ] = await Promise.all([
    supabase.from("circles").select("*").eq("id", circleId).maybeSingle<CircleRow>(),
    supabase
      .from("circle_members")
      .select("*")
      .eq("circle_id", circleId)
      .order("payout_round", { ascending: true })
      .overrideTypes<MemberRow[], { merge: false }>(),
    supabase
      .from("circle_rounds")
      .select("*")
      .eq("circle_id", circleId)
      .order("round_number", { ascending: true })
      .overrideTypes<RoundRow[], { merge: false }>(),
    supabase
      .from("circle_contributions")
      .select("*")
      .eq("circle_id", circleId)
      .overrideTypes<ContributionRow[], { merge: false }>(),
    supabase
      .from("payout_schedule")
      .select("*")
      .eq("circle_id", circleId)
      .order("round_number", { ascending: true })
      .overrideTypes<PayoutRow[], { merge: false }>(),
    supabase
      .from("audit_events")
      .select("*")
      .eq("circle_id", circleId)
      .order("created_at", { ascending: false })
      .limit(200)
      .overrideTypes<AuditEventRow[], { merge: false }>(),
  ]);

  if (circleResult.error || !circleResult.data) {
    return null;
  }

  const circle = mapCircle(circleResult.data);
  const members = (membersResult.data ?? []).map(mapMember);
  const rounds = (roundsResult.data ?? []).map(mapRound);
  const contributions = (contributionsResult.data ?? []).map(mapContribution);
  const payouts = (payoutsResult.data ?? []).map(mapPayout);
  const auditEvents = (auditResult.data ?? []).map((row) => {
    const event = mapAuditEvent(row);
    // Enrich contribution details
    if (
      event.eventType.startsWith("contribution_") ||
      event.eventType === "collateral_posted" ||
      event.eventType === "collateral_slashed" ||
      event.eventType === "collateral_refunded"
    ) {
      const round = rounds.find((r) => r.roundNumber === event.roundNumber);
      const contribution = round
        ? contributions.find((c) => c.memberId === event.memberId && c.roundId === round.id)
        : contributions.find((c) => c.memberId === event.memberId);
      
      event.amount = event.amount ?? (contribution ? contribution.amountDue : circle.contributionAmount);
      event.asset = event.asset ?? circle.contributionAsset;
      event.dueAt = event.dueAt ?? (round ? round.dueAt : null);
      if (contribution) {
        event.paidAt = event.paidAt ?? contribution.paidAt;
        event.status = event.status ?? contribution.status;
        event.txHash = event.txHash ?? contribution.txHash;
      }
    }
    // Enrich payout details
    else if (event.eventType.startsWith("payout_") || event.eventType === "circle_completed") {
      const payout = payouts.find((p) => p.roundNumber === event.roundNumber);
      event.amount = event.amount ?? (payout ? payout.payoutAmount : (circle.contributionAmount * members.length));
      event.asset = event.asset ?? circle.contributionAsset;
      if (payout) {
        event.expectedPayoutAt = event.expectedPayoutAt ?? payout.expectedPayoutAt;
        event.status = event.status ?? payout.status;
        event.txHash = event.txHash ?? payout.txHash;
        event.memberId = event.memberId ?? payout.recipientMemberId;
      }
    }
    return event;
  });

  return {
    creatorId: circleResult.data.creator_id ?? null,
    circle,
    members,
    rounds,
    contributions,
    payouts,
    auditEvents,
  };
}

function mapCreatorCircleListItem(row: CircleRow): CircleListItem {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    role: "creator",
    contributionAmount: toNumber(row.contribution_amount),
    contributionAsset: row.contribution_asset,
    memberCount: row.member_count,
    currentRound: row.current_round,
    totalRounds: row.total_rounds,
    nextDueAt: row.start_date,
  };
}

interface MemberCircleListRow {
  payment_status: DashboardMember["paymentStatus"];
  payout_round: number;
  circles: CircleRow | null;
}

function mapMemberCircleListItem(row: MemberCircleListRow): CircleListItem | null {
  if (!row.circles) return null;

  return {
    id: row.circles.id,
    name: row.circles.name,
    status: row.circles.status,
    role: "member",
    contributionAmount: toNumber(row.circles.contribution_amount),
    contributionAsset: row.circles.contribution_asset,
    memberCount: row.circles.member_count,
    currentRound: row.circles.current_round,
    totalRounds: row.circles.total_rounds,
    nextDueAt: row.circles.start_date,
    myPaymentStatus: row.payment_status,
    myPayoutRound: row.payout_round,
  };
}

export async function getDashboardDTO(): Promise<CirclesDTO> {
  const authContext = await requireAuthenticatedUser("/dashboard");

  if (!authContext.configured || !authContext.user) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const [{ data: creatorCircles }, { data: memberCircleRows }] = await Promise.all([
    supabase
    .from("circles")
    .select("*")
    .eq("creator_id", authContext.user.id)
      .order("created_at", { ascending: false })
      .overrideTypes<CircleRow[], { merge: false }>(),
    supabase
    .from("circle_members")
      .select("payment_status,payout_round,circles(*)")
    .eq("profile_id", authContext.user.id)
    .neq("role", "creator")
      .order("created_at", { ascending: false })
      .overrideTypes<MemberCircleListRow[], { merge: false }>(),
  ]);

  return [
    ...(creatorCircles ?? []).map(mapCreatorCircleListItem),
    ...(memberCircleRows ?? []).map(mapMemberCircleListItem).filter(Boolean),
  ] as CirclesDTO;
}

export interface NotificationWithCircle extends DashboardNotification {
  circleName: string;
}

/** All notifications for the signed-in user, across every circle they're in. */
export async function getUserNotifications(): Promise<NotificationWithCircle[]> {
  const authContext = await requireAuthenticatedUser("/dashboard");
  if (!authContext.configured || !authContext.user) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("member_notifications")
    .select("*, circles(name)")
    .eq("profile_id", authContext.user.id)
    .order("created_at", { ascending: false })
    .limit(30)
    .overrideTypes<(NotificationRow & { circles: { name: string } | null })[], { merge: false }>();

  return (data ?? []).map((row) => ({
    ...mapNotification(row),
    circleName: row.circles?.name ?? "Circle",
  }));
}

export async function getCircleDTO(circleId: string): Promise<CircleEnrichedDTO | null> {
  const authContext = await requireAuthenticatedUser(`/dashboard/${circleId}`);

  if (!authContext.configured || !authContext.user) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const bundle = await fetchCircleBundle(circleId);

  if (!bundle) {
    return null;
  }

  if (bundle.creatorId === authContext.user.id) {
    return {
      role: "creator",
      circle: bundle.circle,
      members: bundle.members,
      rounds: bundle.rounds,
      contributions: bundle.contributions,
      payouts: bundle.payouts,
      auditEvents: bundle.auditEvents,
    } satisfies CreatorDashboardDTO;
  }

  const currentMember = bundle.members.find(
    (member) => member.profileId === authContext.user?.id && member.role !== "creator"
  );

  if (!currentMember) {
    return null;
  }

  const { data: notifications } = await supabase
    .from("member_notifications")
    .select("*")
    .eq("circle_id", circleId)
    .eq("profile_id", authContext.user.id)
    .order("created_at", { ascending: false })
    .limit(12)
    .overrideTypes<NotificationRow[], { merge: false }>();

  return {
    role: "member",
    circle: bundle.circle,
    members: bundle.members,
    rounds: bundle.rounds,
    contributions: bundle.contributions,
    payouts: bundle.payouts,
    auditEvents: bundle.auditEvents,
    currentMember,
    notifications: (notifications ?? []).map(mapNotification),
  } satisfies MemberDashboardDTO;
}
