import "server-only";

import { getIsSupabaseConfigured } from "@/lib/env";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CircleStatus,
  CreatorDashboardDTO,
  DashboardAuditEvent,
  DashboardCircle,
  DashboardContribution,
  DashboardDTO,
  DashboardMember,
  DashboardNotification,
  DashboardPayout,
  DashboardRound,
  MemberDashboardDTO,
} from "@/lib/dashboard/types";

interface CircleRow {
  id: string;
  name: string;
  status: CircleStatus;
  contribution_amount: number | string;
  contribution_asset: string;
  interval_seconds: number;
  member_count: number;
  collateral_amount: number | string;
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

interface ContributionRow {
  id: string;
  round_id: string;
  member_id: string;
  amount_due: number | string;
  status: DashboardContribution["status"];
  tx_hash: string | null;
  paid_at: string | null;
}

interface PayoutRow {
  id: string;
  round_number: number;
  recipient_member_id: string | null;
  expected_payout_at: string | null;
  status: DashboardPayout["status"];
  tx_hash: string | null;
}

interface AuditEventRow {
  id: string;
  member_id: string | null;
  event_type: string;
  round_number: number | null;
  tx_hash: string | null;
  created_at: string;
}

interface NotificationRow {
  id: string;
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
    intervalSeconds: row.interval_seconds,
    memberCount: row.member_count,
    collateralAmount: toNumber(row.collateral_amount),
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
    role: row.role,
    inviteStatus: row.invite_status,
    agreementStatus: row.agreement_status,
    collateralStatus: row.collateral_status,
    paymentStatus: row.payment_status,
    payoutRound: row.payout_round,
    restrictionStatus: row.restriction_status,
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
  };
}

function mapPayout(row: PayoutRow): DashboardPayout {
  return {
    id: row.id,
    roundNumber: row.round_number,
    recipientMemberId: row.recipient_member_id,
    expectedPayoutAt: row.expected_payout_at,
    status: row.status,
    txHash: row.tx_hash,
  };
}

function mapAuditEvent(row: AuditEventRow): DashboardAuditEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    memberId: row.member_id,
    roundNumber: row.round_number,
    txHash: row.tx_hash,
    createdAt: row.created_at,
  };
}

function mapNotification(row: NotificationRow): DashboardNotification {
  return {
    id: row.id,
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
      .returns<MemberRow[]>(),
    supabase
      .from("circle_rounds")
      .select("*")
      .eq("circle_id", circleId)
      .order("round_number", { ascending: true })
      .returns<RoundRow[]>(),
    supabase
      .from("circle_contributions")
      .select("*")
      .eq("circle_id", circleId)
      .returns<ContributionRow[]>(),
    supabase
      .from("payout_schedule")
      .select("*")
      .eq("circle_id", circleId)
      .order("round_number", { ascending: true })
      .returns<PayoutRow[]>(),
    supabase
      .from("audit_events")
      .select("*")
      .eq("circle_id", circleId)
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<AuditEventRow[]>(),
  ]);

  if (circleResult.error || !circleResult.data) {
    return null;
  }

  return {
    circle: mapCircle(circleResult.data),
    members: (membersResult.data ?? []).map(mapMember),
    rounds: (roundsResult.data ?? []).map(mapRound),
    contributions: (contributionsResult.data ?? []).map(mapContribution),
    payouts: (payoutsResult.data ?? []).map(mapPayout),
    auditEvents: (auditResult.data ?? []).map(mapAuditEvent),
  };
}

export async function getDashboardDTO(): Promise<DashboardDTO> {
  const authContext = await requireAuthenticatedUser("/dashboard");

  if (!getIsSupabaseConfigured() || !authContext.configured || !authContext.user) {
    return {
      role: "empty",
      configured: getIsSupabaseConfigured(),
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: creatorCircle } = await supabase
    .from("circles")
    .select("id")
    .eq("creator_id", authContext.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (creatorCircle) {
    const bundle = await fetchCircleBundle(creatorCircle.id);

    if (bundle) {
      return {
        role: "creator",
        ...bundle,
      } satisfies CreatorDashboardDTO;
    }
  }

  const { data: memberCircle } = await supabase
    .from("circle_members")
    .select("id,circle_id")
    .eq("profile_id", authContext.user.id)
    .neq("role", "creator")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; circle_id: string }>();

  if (!memberCircle) {
    return {
      role: "empty",
      configured: true,
    };
  }

  const bundle = await fetchCircleBundle(memberCircle.circle_id);

  if (!bundle) {
    return {
      role: "empty",
      configured: true,
    };
  }

  const currentMember = bundle.members.find((member) => member.id === memberCircle.id);

  if (!currentMember) {
    return {
      role: "empty",
      configured: true,
    };
  }

  const { data: notifications } = await supabase
    .from("member_notifications")
    .select("*")
    .eq("circle_id", memberCircle.circle_id)
    .eq("profile_id", authContext.user.id)
    .order("created_at", { ascending: false })
    .limit(12)
    .returns<NotificationRow[]>();

  return {
    role: "member",
    ...bundle,
    currentMember,
    notifications: (notifications ?? []).map(mapNotification),
  } satisfies MemberDashboardDTO;
}
