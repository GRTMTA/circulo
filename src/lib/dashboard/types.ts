export const circleStatuses = [
  "draft",
  "active",
  "delayed",
  "completed",
  "disputed",
  "cancelled",
] as const;

export type CircleStatus = (typeof circleStatuses)[number];

export type DashboardRole = "creator" | "member";

export interface DashboardCircle {
  id: string;
  name: string;
  status: CircleStatus;
  contributionAmount: number;
  contributionAsset: string;
  intervalSeconds: number;
  memberCount: number;
  collateralAmount: number;
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
  role: DashboardRole;
  inviteStatus: "invited" | "accepted" | "declined" | "expired";
  agreementStatus: "accepted" | "pending";
  collateralStatus: "not_posted" | "posted" | "partially_slashed" | "fully_slashed";
  paymentStatus: "paid" | "pending" | "late" | "missed" | "not_due" | "disputed";
  payoutRound: number;
  restrictionStatus: "clear" | "warning" | "restricted";
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
}

export interface DashboardPayout {
  id: string;
  roundNumber: number;
  recipientMemberId: string | null;
  expectedPayoutAt: string | null;
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
  notificationType: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

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
