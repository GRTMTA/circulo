import type {
  CircleListItem,
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
} from "../../src/lib/dashboard/types";

export const membersFixture: DashboardMember[] = [
  {
    id: "member-creator",
    profileId: "profile-creator",
    displayName: "Ari Santos",
    walletAddress: "GABC91A2CREATOR000000000000000000000000000000000000000001",
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Ari+Santos&backgroundColor=2f6f5e",
    role: "creator",
    inviteStatus: "accepted",
    agreementStatus: "accepted",
    collateralStatus: "posted",
    paymentStatus: "paid",
    payoutRound: 1,
    restrictionStatus: "clear",
    lateCount: 0,
    slashedAmount: 0,
    joinedAt: "2026-07-08T10:05:00.000Z",
  },
  {
    id: "member-b",
    profileId: "profile-b",
    displayName: "Bea Lim",
    walletAddress: "GDEF22FPENDING000000000000000000000000000000000000000002",
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Bea+Lim&backgroundColor=7b3126",
    role: "member",
    inviteStatus: "accepted",
    agreementStatus: "accepted",
    collateralStatus: "posted",
    paymentStatus: "pending",
    payoutRound: 2,
    restrictionStatus: "clear",
    lateCount: 0,
    slashedAmount: 0,
    joinedAt: "2026-07-08T10:15:00.000Z",
  },
  {
    id: "member-c",
    profileId: "profile-c",
    displayName: "Carlo Reyes",
    walletAddress: "GHIJ8KQLATE00000000000000000000000000000000000000000003",
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Carlo+Reyes&backgroundColor=d4a843",
    role: "member",
    inviteStatus: "accepted",
    agreementStatus: "accepted",
    collateralStatus: "partially_slashed",
    paymentStatus: "late",
    payoutRound: 3,
    restrictionStatus: "warning",
    lateCount: 1,
    slashedAmount: 2.5,
    joinedAt: "2026-07-08T10:20:00.000Z",
  },
  {
    id: "member-d",
    profileId: "profile-d",
    displayName: "Dina Cruz",
    walletAddress: "GKLM44DPOSTED000000000000000000000000000000000000000004",
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Dina+Cruz&backgroundColor=4a6fa1",
    role: "member",
    inviteStatus: "invited",
    agreementStatus: "pending",
    collateralStatus: "not_posted",
    paymentStatus: "not_due",
    payoutRound: 4,
    restrictionStatus: "clear",
    lateCount: 0,
    slashedAmount: 0,
    joinedAt: null,
  },
  {
    id: "member-e",
    profileId: "profile-e",
    displayName: "Enzo Tan",
    walletAddress: "GNOP55ERESTRICTED00000000000000000000000000000000000005",
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Enzo+Tan&backgroundColor=8b5e9e",
    role: "member",
    inviteStatus: "expired",
    agreementStatus: "pending",
    collateralStatus: "fully_slashed",
    paymentStatus: "missed",
    payoutRound: 5,
    restrictionStatus: "restricted",
    lateCount: 2,
    slashedAmount: 5,
    joinedAt: null,
  },
];

export function createMembersFixture(
  overrides: Partial<DashboardMember>[] = []
): DashboardMember[] {
  return membersFixture.map((member, index) => ({
    ...member,
    ...overrides[index],
  }));
}

export const contributionsFixture: DashboardContribution[] = [
  {
    id: "contribution-paid",
    roundId: "round-2",
    memberId: "member-creator",
    amountDue: 10,
    status: "paid",
    txHash: "tx_paid_91a2",
    paidAt: "2026-07-08T14:05:00.000Z",
    slashedAmount: 0,
    slashedAt: null,
    remindersSent: 0,
  },
  {
    id: "contribution-pending",
    roundId: "round-2",
    memberId: "member-b",
    amountDue: 10,
    status: "pending",
    txHash: null,
    paidAt: null,
    slashedAmount: 0,
    slashedAt: null,
    remindersSent: 1,
  },
  {
    id: "contribution-late",
    roundId: "round-2",
    memberId: "member-c",
    amountDue: 10,
    status: "late",
    txHash: null,
    paidAt: null,
    slashedAmount: 2.5,
    slashedAt: "2026-07-08T20:05:00.000Z",
    remindersSent: 2,
  },
  {
    id: "contribution-grace",
    roundId: "round-2",
    memberId: "member-d",
    amountDue: 10,
    status: "grace_period",
    txHash: null,
    paidAt: null,
    slashedAmount: 0,
    slashedAt: null,
    remindersSent: 1,
  },
  {
    id: "contribution-missed",
    roundId: "round-2",
    memberId: "member-e",
    amountDue: 10,
    status: "missed",
    txHash: null,
    paidAt: null,
    slashedAmount: 5,
    slashedAt: "2026-07-08T20:05:00.000Z",
    remindersSent: 2,
  },
];

export function createContributionsFixture(
  overrides: Partial<DashboardContribution>[] = []
): DashboardContribution[] {
  return contributionsFixture.map((contribution, index) => ({
    ...contribution,
    ...overrides[index],
  }));
}

export const payoutsFixture: DashboardPayout[] = [
  {
    id: "payout-1",
    roundNumber: 1,
    recipientMemberId: "member-creator",
    payoutAmount: 50,
    expectedPayoutAt: "2026-07-08T16:00:00.000Z",
    withheldAmount: 0,
    status: "paid",
    txHash: "tx_payout_91a2",
  },
  {
    id: "payout-2",
    roundNumber: 2,
    recipientMemberId: "member-b",
    payoutAmount: 52.5,
    expectedPayoutAt: "2026-07-09T16:00:00.000Z",
    withheldAmount: 0,
    status: "ready",
    txHash: null,
  },
  {
    id: "payout-3",
    roundNumber: 3,
    recipientMemberId: "member-c",
    payoutAmount: 47.5,
    expectedPayoutAt: "2026-07-10T16:00:00.000Z",
    withheldAmount: 2.5,
    status: "scheduled",
    txHash: null,
  },
  {
    id: "payout-4",
    roundNumber: 4,
    recipientMemberId: "member-d",
    payoutAmount: 50,
    expectedPayoutAt: "2026-07-11T16:00:00.000Z",
    withheldAmount: 0,
    status: "delayed",
    txHash: null,
  },
  {
    id: "payout-5",
    roundNumber: 5,
    recipientMemberId: "member-e",
    payoutAmount: 50,
    expectedPayoutAt: "2026-07-12T16:00:00.000Z",
    withheldAmount: 0,
    status: "disputed",
    txHash: null,
  },
];


export function createPayoutsFixture(
  overrides: Partial<DashboardPayout>[] = []
): DashboardPayout[] {
  return payoutsFixture.map((payout, index) => ({
    ...payout,
    ...overrides[index],
  }));
}

export const roundsFixture: DashboardRound[] = [
  {
    id: "round-1",
    roundNumber: 1,
    dueAt: "2026-07-08T12:00:00.000Z",
    payoutMemberId: "member-creator",
    expectedAmount: 50,
    collectedAmount: 50,
    status: "completed",
  },
  {
    id: "round-2",
    roundNumber: 2,
    dueAt: "2026-07-09T12:00:00.000Z",
    payoutMemberId: "member-b",
    expectedAmount: 50,
    collectedAmount: 20,
    status: "active",
  },
  {
    id: "round-3",
    roundNumber: 3,
    dueAt: "2026-07-10T12:00:00.000Z",
    payoutMemberId: "member-c",
    expectedAmount: 50,
    collectedAmount: 0,
    status: "scheduled",
  },
];

export function createRoundsFixture(
  overrides: Partial<DashboardRound>[] = []
): DashboardRound[] {
  return roundsFixture.map((round, index) => ({
    ...round,
    ...overrides[index],
  }));
}

export const auditEventsFixture: DashboardAuditEvent[] = [
  { id: "audit-created", eventType: "pool_created", memberId: "member-creator", roundNumber: null, txHash: null, createdAt: "2026-07-08T10:00:00.000Z" },
  { id: "audit-activated", eventType: "circle_activated", memberId: "member-creator", roundNumber: null, txHash: null, createdAt: "2026-07-08T10:15:00.000Z" },
  { id: "audit-joined-a", eventType: "member_invited", memberId: "member-b", roundNumber: null, txHash: null, createdAt: "2026-07-08T10:20:00.000Z" },
  { id: "audit-joined-b", eventType: "agreement_accepted", memberId: "member-b", roundNumber: null, txHash: null, createdAt: "2026-07-08T10:25:00.000Z" },
  { id: "audit-collateral", eventType: "collateral_posted", memberId: "member-b", roundNumber: null, txHash: "tx_collateral_22f", createdAt: "2026-07-08T10:35:00.000Z" },
  { id: "audit-round1-start", eventType: "round_started", memberId: null, roundNumber: 1, txHash: null, createdAt: "2026-07-08T12:00:00.000Z" },
  { id: "audit-round1-done", eventType: "round_completed", memberId: null, roundNumber: 1, txHash: null, createdAt: "2026-07-08T13:00:00.000Z" },
  { id: "audit-payout-1", eventType: "payout_released", memberId: "member-creator", roundNumber: 1, txHash: "tx_payout_91a2", createdAt: "2026-07-08T16:00:00.000Z" },
  { id: "audit-round2-start", eventType: "round_started", memberId: null, roundNumber: 2, txHash: null, createdAt: "2026-07-09T12:00:00.000Z" },
  { id: "audit-paid-a", eventType: "contribution_paid", memberId: "member-creator", roundNumber: 2, txHash: "tx_paid_91a2", createdAt: "2026-07-09T14:05:00.000Z" },
  { id: "audit-grace", eventType: "grace_period_started", memberId: "member-c", roundNumber: 2, txHash: null, createdAt: "2026-07-09T18:00:00.000Z" },
  { id: "audit-reminder", eventType: "reminder_sent", memberId: "member-c", roundNumber: 2, txHash: null, createdAt: "2026-07-09T19:00:00.000Z" },
  { id: "audit-slashed", eventType: "collateral_slashed", memberId: "member-c", roundNumber: 2, txHash: "tx_slash_8kq", createdAt: "2026-07-09T20:05:00.000Z" },
  { id: "audit-restricted", eventType: "member_restricted", memberId: "member-e", roundNumber: 1, txHash: null, createdAt: "2026-07-09T20:15:00.000Z" },
  { id: "audit-dispute", eventType: "dispute_raised", memberId: "member-c", roundNumber: 2, txHash: null, createdAt: "2026-07-09T20:30:00.000Z" },
  { id: "audit-paused", eventType: "circle_paused", memberId: "member-creator", roundNumber: 2, txHash: null, createdAt: "2026-07-09T21:00:00.000Z" },
];

export function createAuditEventsFixture(): DashboardAuditEvent[] {
  return auditEventsFixture.map((event) => ({ ...event }));
}

export const auditEventTypesFixture: string[] = [
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
];


const circleFixture: DashboardCircle = {
  id: "circle-makati-friday",
  name: "Makati Friday Circle",
  status: "active",
  contributionAmount: 10,
  contributionAsset: "USDC",
  cycleCount: 1,
  timeZone: "Asia/Manila",
  intervalSeconds: 86_400,
  memberCount: 5,
  maxMemberCount: 10,
  collateralAmount: 5,
  gracePeriodHours: 4,
  slashPercentage: 100,
  warningThreshold: 2,
  autoSlashEnabled: true,
  payoutOrderMode: "creator",
  reminderScheduleHours: [24, 1],
  currentRound: 2,
  totalRounds: 5,
  startDate: "2026-07-08T12:00:00.000Z",
  settingsLocked: true,
  payoutOrderLocked: true,
  rulesLocked: true,
};

function createCircleFixture(
  overrides: Partial<DashboardCircle> = {}
): DashboardCircle {
  return { ...circleFixture, ...overrides };
}

const notificationsFixture: DashboardNotification[] = [
  {
    id: "notification-due",
    notificationType: "contribution_due_now",
    title: "Contribution due now",
    body: "Your 10 USDC contribution is due for round 2.",
    readAt: null,
    createdAt: "2026-07-09T12:00:00.000Z",
  },
  {
    id: "notification-payout",
    notificationType: "payout_ready",
    title: "Payout readiness updated",
    body: "Round 2 payout can release once all contributions are verified.",
    readAt: "2026-07-09T13:00:00.000Z",
    createdAt: "2026-07-09T12:30:00.000Z",
  },
  {
    id: "notification-overdue",
    notificationType: "contribution_overdue",
    title: "Contribution overdue",
    body: "Your 10 USDC contribution for round 2 is now overdue.",
    readAt: null,
    createdAt: "2026-07-09T12:05:00.000Z",
  },
  {
    id: "notification-grace",
    notificationType: "grace_period_warning",
    title: "Grace period active",
    body: "You're in the 4-hour grace period for round 2. Pay now to avoid collateral slash.",
    readAt: null,
    createdAt: "2026-07-09T18:00:00.000Z",
  },
  {
    id: "notification-slashed",
    notificationType: "collateral_slashed",
    title: "Collateral slashed",
    body: "2.5 USDC was slashed from your collateral for missing round 2 contribution.",
    readAt: null,
    createdAt: "2026-07-09T20:05:00.000Z",
  },
  {
    id: "notification-restricted",
    notificationType: "member_restricted",
    title: "Account restricted",
    body: "You have been restricted from creating or joining future circles due to repeated defaults.",
    readAt: null,
    createdAt: "2026-07-09T20:16:00.000Z",
  },
  {
    id: "notification-activated",
    notificationType: "circle_activated",
    title: "Circle activated",
    body: "Makati Friday Circle is now active. Round 1 contributions are due on Jul 8.",
    readAt: "2026-07-08T10:16:00.000Z",
    createdAt: "2026-07-08T10:15:00.000Z",
  },
  {
    id: "notification-invited",
    notificationType: "member_invited",
    title: "You've been invited",
    body: "Ari Santos invited you to join Makati Friday Circle. Accept the agreement to join.",
    readAt: null,
    createdAt: "2026-07-08T10:20:00.000Z",
  },
  {
    id: "notification-due-soon",
    notificationType: "contribution_due_soon",
    title: "Contribution due in 24 hours",
    body: "Your 10 USDC contribution for round 2 is due tomorrow. Make sure your wallet is ready.",
    readAt: null,
    createdAt: "2026-07-08T12:00:00.000Z",
  },
  {
    id: "notification-paused",
    notificationType: "circle_paused",
    title: "Circle paused",
    body: "Makati Friday Circle has been paused by the creator. Contributions and payouts are halted.",
    readAt: null,
    createdAt: "2026-07-09T21:01:00.000Z",
  },
  {
    id: "notification-collateral-required",
    notificationType: "collateral_required",
    title: "Collateral required",
    body: "Post your 5 USDC collateral to activate your membership in Makati Friday Circle.",
    readAt: null,
    createdAt: "2026-07-08T10:21:00.000Z",
  },
  {
    id: "notification-agreement",
    notificationType: "agreement_required",
    title: "Agreement pending",
    body: "Review and accept the circle rules to finalize your membership.",
    readAt: null,
    createdAt: "2026-07-08T10:21:00.000Z",
  },
];


export function createCreatorDashboardFixture(
  overrides: Partial<CreatorDashboardDTO> = {}
): CreatorDashboardDTO {
  return {
    role: "creator",
    circle: createCircleFixture(),
    members: createMembersFixture(),
    rounds: createRoundsFixture(),
    contributions: createContributionsFixture(),
    payouts: createPayoutsFixture(),
    auditEvents: createAuditEventsFixture(),
    ...overrides,
  };
}

export function createMemberDashboardFixture(
  overrides: Partial<MemberDashboardDTO> = {}
): MemberDashboardDTO {
  const members = createMembersFixture();

  return {
    role: "member",
    circle: createCircleFixture({ status: "active" }),
    currentMember: members[2],
    members,
    rounds: createRoundsFixture(),
    contributions: createContributionsFixture(),
    payouts: createPayoutsFixture(),
    auditEvents: createAuditEventsFixture(),
    notifications: notificationsFixture.map((notification) => ({ ...notification })),
    ...overrides,
  };
}

const firstCircleFixture: CircleListItem = {
  id: "circle-makati-friday",
  name: "Makati Friday Circle",
  status: "active",
  role: "creator",
  contributionAmount: 10,
  contributionAsset: "USDC",
  memberCount: 5,
  currentRound: 2,
  totalRounds: 5,
  nextDueAt: "2026-07-09T12:00:00.000Z",
};

const circleSeeds: CirclesDTO = [
  firstCircleFixture,
  {
    id: "circle-quezon-draft",
    name: "Quezon Draft Circle",
    status: "draft",
    role: "creator",
    contributionAmount: 25,
    contributionAsset: "USDC",
    memberCount: 4,
    currentRound: 0,
    totalRounds: 4,
    nextDueAt: null,
  },
  {
    id: "circle-baguio-coop",
    name: "Baguio Coop Circle",
    status: "active",
    role: "member",
    contributionAmount: 15,
    contributionAsset: "USDT",
    memberCount: 6,
    currentRound: 3,
    totalRounds: 6,
    nextDueAt: "2026-07-10T08:00:00.000Z",
    myPaymentStatus: "due_soon",
    myPayoutRound: 5,
  },
  {
    id: "circle-davao-complete",
    name: "Davao Completed Circle",
    status: "completed",
    role: "member",
    contributionAmount: 20,
    contributionAsset: "USDC",
    memberCount: 5,
    currentRound: 5,
    totalRounds: 5,
    nextDueAt: null,
    myPaymentStatus: "paid",
    myPayoutRound: 2,
  },
  {
    id: "circle-cebu-cancelled",
    name: "Cebu Cancelled Circle",
    status: "cancelled",
    role: "creator",
    contributionAmount: 12,
    contributionAsset: "USDC",
    memberCount: 5,
    currentRound: 1,
    totalRounds: 5,
    nextDueAt: null,
  },
];

export function createCirclesListFixture(count = 5): CirclesDTO {
  return Array.from({ length: count }, (_, index) => {
    const seed = circleSeeds[index % circleSeeds.length];
    return index < circleSeeds.length
      ? { ...seed }
      : {
          ...seed,
          id: `${seed.id}-${index + 1}`,
          name: `${seed.name} ${index + 1}`,
        };
  });
}
