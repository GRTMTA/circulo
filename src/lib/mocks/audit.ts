import type { DashboardAuditEvent, DashboardNotification } from "@/lib/dashboard/types";

export const mockAuditEvents: DashboardAuditEvent[] = [
  { id: "audit-created",       eventType: "pool_created",         memberId: "member-creator", roundNumber: null,    txHash: null,                createdAt: "2026-07-08T10:00:00.000Z" },
  { id: "audit-activated",     eventType: "circle_activated",     memberId: "member-creator", roundNumber: null,    txHash: null,                createdAt: "2026-07-08T10:15:00.000Z" },
  { id: "audit-joined-a",      eventType: "member_invited",       memberId: "member-b",       roundNumber: null,    txHash: null,                createdAt: "2026-07-08T10:20:00.000Z" },
  { id: "audit-joined-b",      eventType: "agreement_accepted",   memberId: "member-b",       roundNumber: null,    txHash: null,                createdAt: "2026-07-08T10:25:00.000Z" },
  { id: "audit-collateral",    eventType: "collateral_posted",    memberId: "member-b",       roundNumber: null,    txHash: "tx_collateral_22f", createdAt: "2026-07-08T10:35:00.000Z" },
  { id: "audit-round1-start",  eventType: "round_started",        memberId: null,             roundNumber: 1,       txHash: null,                createdAt: "2026-07-08T12:00:00.000Z" },
  { id: "audit-round1-done",   eventType: "round_completed",      memberId: null,             roundNumber: 1,       txHash: null,                createdAt: "2026-07-08T13:00:00.000Z" },
  { id: "audit-payout-1",      eventType: "payout_released",      memberId: "member-creator", roundNumber: 1,       txHash: "tx_payout_91a2",    createdAt: "2026-07-08T16:00:00.000Z" },
  { id: "audit-round2-start",  eventType: "round_started",        memberId: null,             roundNumber: 2,       txHash: null,                createdAt: "2026-07-09T12:00:00.000Z" },
  { id: "audit-paid-a",        eventType: "contribution_paid",    memberId: "member-creator", roundNumber: 2,       txHash: "tx_paid_91a2",      createdAt: "2026-07-09T14:05:00.000Z" },
  { id: "audit-grace",         eventType: "grace_period_started", memberId: "member-c",       roundNumber: 2,       txHash: null,                createdAt: "2026-07-09T18:00:00.000Z" },
  { id: "audit-reminder",      eventType: "reminder_sent",        memberId: "member-c",       roundNumber: 2,       txHash: null,                createdAt: "2026-07-09T19:00:00.000Z" },
  { id: "audit-slashed",       eventType: "collateral_slashed",   memberId: "member-c",       roundNumber: 2,       txHash: "tx_slash_8kq",      createdAt: "2026-07-09T20:05:00.000Z" },
  { id: "audit-restricted",    eventType: "member_restricted",    memberId: "member-e",       roundNumber: 1,       txHash: null,                createdAt: "2026-07-09T20:15:00.000Z" },
  { id: "audit-dispute",       eventType: "dispute_raised",       memberId: "member-c",       roundNumber: 2,       txHash: null,                createdAt: "2026-07-09T20:30:00.000Z" },
  { id: "audit-paused",        eventType: "circle_paused",        memberId: "member-creator", roundNumber: 2,       txHash: null,                createdAt: "2026-07-09T21:00:00.000Z" },
];

export const mockAuditEventTypes: string[] = [
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

export const mockNotifications: DashboardNotification[] = [
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

export function createMockAuditEvents(
  overrides: Partial<DashboardAuditEvent>[] = []
): DashboardAuditEvent[] {
  return mockAuditEvents.map((event, index) => ({
    ...event,
    ...overrides[index],
  }));
}

export function createMockNotifications(
  count: number = 5,
  overrides: Partial<DashboardNotification>[] = []
): DashboardNotification[] {
  const base = mockNotifications.slice(0, count);
  return base.map((notification, index) => ({
    ...notification,
    ...overrides[index],
  }));
}
