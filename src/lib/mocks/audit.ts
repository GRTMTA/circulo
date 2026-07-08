import type { DashboardAuditEvent, DashboardNotification } from "@/lib/dashboard/types";

export const mockAuditEvents: DashboardAuditEvent[] = [
  {
    id: "audit-created",
    eventType: "pool_created",
    memberId: "member-creator",
    roundNumber: null,
    txHash: null,
    createdAt: "2026-07-08T10:00:00.000Z",
  },
  {
    id: "audit-collateral",
    eventType: "collateral_posted",
    memberId: "member-b",
    roundNumber: null,
    txHash: "tx_collateral_22f",
    createdAt: "2026-07-08T10:35:00.000Z",
  },
  {
    id: "audit-paid",
    eventType: "contribution_paid",
    memberId: "member-creator",
    roundNumber: 2,
    txHash: "tx_paid_91a2",
    createdAt: "2026-07-08T14:05:00.000Z",
  },
  {
    id: "audit-grace",
    eventType: "grace_period_started",
    memberId: "member-c",
    roundNumber: 2,
    txHash: null,
    createdAt: "2026-07-08T18:00:00.000Z",
  },
  {
    id: "audit-slashed",
    eventType: "collateral_slashed",
    memberId: "member-c",
    roundNumber: 2,
    txHash: "tx_slash_8kq",
    createdAt: "2026-07-08T20:05:00.000Z",
  },
  {
    id: "audit-restricted",
    eventType: "member_restricted",
    memberId: "member-e",
    roundNumber: 1,
    txHash: null,
    createdAt: "2026-07-08T20:15:00.000Z",
  },
  {
    id: "audit-dispute",
    eventType: "dispute_raised",
    memberId: "member-c",
    roundNumber: 2,
    txHash: null,
    createdAt: "2026-07-08T20:30:00.000Z",
  },
  {
    id: "audit-paused",
    eventType: "circle_paused",
    memberId: "member-creator",
    roundNumber: 2,
    txHash: null,
    createdAt: "2026-07-08T21:00:00.000Z",
  },
];

export const mockAuditEventTypes = [
  "circle_paused",
  "circle_resumed",
  "circle_cancelled",
  "dispute_raised",
  "dispute_resolved",
  "member_restricted",
  "collateral_slashed",
  "member_invited",
  "agreement_accepted",
  "pool_created",
  "contribution_paid",
  "payout_released",
];

export const mockNotifications: DashboardNotification[] = [
  {
    id: "notification-due",
    notificationType: "contribution_due_now",
    title: "Contribution due now",
    body: "Your 10 USDC contribution is due for round 2.",
    readAt: null,
    createdAt: "2026-07-08T12:00:00.000Z",
  },
  {
    id: "notification-payout",
    notificationType: "payout_ready",
    title: "Payout readiness updated",
    body: "Round 2 payout can release once all contributions are verified.",
    readAt: "2026-07-08T13:00:00.000Z",
    createdAt: "2026-07-08T12:30:00.000Z",
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
