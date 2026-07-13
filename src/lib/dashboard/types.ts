export const circleStatuses = [
  "draft",
  "active",
  "paused",
  "delayed",
  "completed",
  "disputed",
  "cancelled",
] as const;

export type CircleStatus = (typeof circleStatuses)[number];

export type DashboardRole = "creator" | "member";

export type PayoutOrderMode = "creator" | "voting";

export interface DashboardCircle {
  id: string;
  name: string;
  status: CircleStatus;
  contributionAmount: number;
  contributionAsset: string;
  intervalSeconds: number;
  memberCount: number;
  maxMemberCount: number;
  collateralAmount: number;
  gracePeriodHours: number;
  slashPercentage: number;
  warningThreshold: number;
  autoSlashEnabled: boolean;
  payoutOrderMode: PayoutOrderMode;
  reminderScheduleHours: number[];
  currentRound: number;
  totalRounds: number;
  startDate: string | null;
  settingsLocked: boolean;
  payoutOrderLocked: boolean;
  rulesLocked: boolean;
}

export interface DashboardMember {
  id: string;
  profileId: string | null;
  displayName: string;
  walletAddress: string;
  avatarUrl: string | null;
  role: DashboardRole;
  inviteStatus: "invited" | "accepted" | "declined" | "expired";
  agreementStatus: "accepted" | "pending";
  collateralStatus: "not_posted" | "posted" | "partially_slashed" | "fully_slashed";
  paymentStatus: "paid" | "pending" | "late" | "missed" | "not_due" | "disputed";
  payoutRound: number;
  restrictionStatus: "clear" | "warning" | "restricted";
  lateCount: number;
  slashedAmount: number;
  joinedAt: string | null;
}

export interface DashboardRound {
  id: string;
  roundNumber: number;
  dueAt: string | null;
  payoutMemberId: string | null;
  expectedAmount: number;
  collectedAmount: number;
  status:
    | "scheduled"
    | "active"
    | "late"
    | "grace_period"
    | "paid"
    | "delayed"
    | "disputed"
    | "completed";
}

export interface DashboardContribution {
  id: string;
  roundId: string;
  memberId: string;
  amountDue: number;
  status:
    | "not_due"
    | "due_soon"
    | "due_now"
    | "verifying"
    | "paid"
    | "pending"
    | "late"
    | "grace_period"
    | "missed"
    | "disputed";
  txHash: string | null;
  paidAt: string | null;
  slashedAmount: number;
  slashedAt: string | null;
  remindersSent: number;
}

export interface DashboardPayout {
  id: string;
  roundNumber: number;
  recipientMemberId: string | null;
  payoutAmount: number;
  expectedPayoutAt: string | null;
  withheldAmount: number;
  status: "scheduled" | "ready" | "paid" | "delayed" | "disputed";
  txHash: string | null;
}

export interface DashboardAuditEvent {
  id: string;
  eventType: string;
  memberId: string | null;
  roundNumber: number | null;
  txHash: string | null;
  createdAt: string;
}

export interface DashboardNotification {
  id: string;
  circleId?: string;
  notificationType: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export const auditEventTypes = [
  "pool_created",
  "circle_activated",
  "circle_completed",
  "circle_paused",
  "circle_resumed",
  "circle_cancelled",
  "dispute_raised",
  "dispute_resolved",
  "member_invited",
  "agreement_accepted",
  "collateral_posted",
  "collateral_slashed",
  "collateral_refunded",
  "contribution_paid",
  "contribution_verified",
  "payout_initiated",
  "payout_released",
  "reminder_sent",
  "grace_period_started",
  "grace_period_ended",
  "member_restricted",
  "member_left",
  "round_started",
  "round_completed",
  "settings_changed",
  "payout_order_changed",
] as const;

export type AuditEventType = (typeof auditEventTypes)[number];

export const notificationTypes = [
  "contribution_due_soon",
  "contribution_due_now",
  "contribution_overdue",
  "collateral_slashed",
  "collateral_refunded",
  "collateral_required",
  "member_restricted",
  "payout_ready",
  "payout_received",
  "circle_activated",
  "circle_paused",
  "circle_resumed",
  "circle_cancelled",
  "grace_period_warning",
  "member_invited",
  "agreement_required",
  "dispute_resolved",
  "round_completed",
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export interface CircleListItem {
  id: string;
  name: string;
  status: CircleStatus;
  role: DashboardRole;
  contributionAmount: number;
  contributionAsset: string;
  memberCount: number;
  currentRound: number;
  totalRounds: number;
  nextDueAt: string | null;
  myPaymentStatus?: DashboardMember["paymentStatus"] | DashboardContribution["status"];
  myPayoutRound?: number;
}

export type CirclesDTO = CircleListItem[];

export interface CreatorDashboardDTO {
  role: "creator";
  circle: DashboardCircle;
  members: DashboardMember[];
  rounds: DashboardRound[];
  contributions: DashboardContribution[];
  payouts: DashboardPayout[];
  auditEvents: DashboardAuditEvent[];
}

export interface MemberDashboardDTO {
  role: "member";
  circle: DashboardCircle;
  currentMember: DashboardMember;
  members: DashboardMember[];
  rounds: DashboardRound[];
  contributions: DashboardContribution[];
  payouts: DashboardPayout[];
  auditEvents: DashboardAuditEvent[];
  notifications: DashboardNotification[];
}

export type CircleEnrichedDTO = CreatorDashboardDTO | MemberDashboardDTO;

export type DashboardDTO =
  | CreatorDashboardDTO
  | MemberDashboardDTO
  | { role: "empty"; configured: boolean };
