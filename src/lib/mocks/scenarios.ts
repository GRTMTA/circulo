import type { CreatorDashboardDTO, MemberDashboardDTO } from "@/lib/dashboard/types";
import { createMockAuditEvents, createMockNotifications } from "@/lib/mocks/audit";
import { createMockCircle } from "@/lib/mocks/circles";
import { createMockContributions } from "@/lib/mocks/contributions";
import { createMockRounds } from "@/lib/mocks/cycles";
import { createMockMembers } from "@/lib/mocks/members";
import { createMockPayouts } from "@/lib/mocks/payouts";

export function createPerfectCircleMock(): CreatorDashboardDTO {
  const members = createMockMembers([
    { paymentStatus: "paid", lateCount: 0, slashedAmount: 0, restrictionStatus: "clear", collateralStatus: "posted" },
    { paymentStatus: "paid", lateCount: 0, slashedAmount: 0, restrictionStatus: "clear" },
    { paymentStatus: "paid", lateCount: 0, slashedAmount: 0, restrictionStatus: "clear" },
    { paymentStatus: "paid", lateCount: 0, slashedAmount: 0, restrictionStatus: "clear" },
    { paymentStatus: "paid", lateCount: 0, slashedAmount: 0, restrictionStatus: "clear" },
  ]);

  return {
    role: "creator",
    circle: createMockCircle({ status: "completed", currentRound: 5 }),
    members,
    rounds: createMockRounds([
      { status: "completed", collectedAmount: 50 },
      { status: "completed", collectedAmount: 50 },
      { status: "completed", collectedAmount: 50 },
      { status: "completed", collectedAmount: 50 },
      { status: "completed", collectedAmount: 50 },
    ]),
    contributions: createMockContributions([
      { status: "paid", paidAt: "2026-07-08T14:00:00.000Z", txHash: "tx_perfect_a" },
      { status: "paid", paidAt: "2026-07-08T14:05:00.000Z", txHash: "tx_perfect_b" },
      { status: "paid", paidAt: "2026-07-08T14:10:00.000Z", txHash: "tx_perfect_c" },
      { status: "paid", paidAt: "2026-07-08T14:15:00.000Z", txHash: "tx_perfect_d" },
      { status: "paid", paidAt: "2026-07-08T14:20:00.000Z", txHash: "tx_perfect_e" },
    ]),
    payouts: createMockPayouts([
      { status: "paid", txHash: "tx_payout_perfect_1" },
      { status: "paid", txHash: "tx_payout_perfect_2" },
      { status: "paid", txHash: "tx_payout_perfect_3" },
      { status: "paid", txHash: "tx_payout_perfect_4" },
      { status: "paid", txHash: "tx_payout_perfect_5" },
    ]),
    auditEvents: createMockAuditEvents(),
  };
}

export function createDefaultedCircleMock(): CreatorDashboardDTO {
  const members = createMockMembers([
    { paymentStatus: "paid", lateCount: 0, slashedAmount: 0, restrictionStatus: "clear" },
    { paymentStatus: "pending", lateCount: 0, slashedAmount: 0, restrictionStatus: "clear" },
    { paymentStatus: "late", lateCount: 1, slashedAmount: 2.5, collateralStatus: "partially_slashed", restrictionStatus: "warning" },
    { paymentStatus: "not_due", lateCount: 0, slashedAmount: 0, restrictionStatus: "clear" },
    { paymentStatus: "not_due", lateCount: 0, slashedAmount: 0, restrictionStatus: "clear" },
  ]);

  return {
    role: "creator",
    circle: createMockCircle({ status: "active", currentRound: 2 }),
    members,
    rounds: createMockRounds([
      { status: "completed", collectedAmount: 50 },
      { status: "late", collectedAmount: 20, expectedAmount: 50 },
    ]),
    contributions: createMockContributions([
      { status: "paid", paidAt: "2026-07-08T14:00:00.000Z", slashedAmount: 0 },
      { status: "pending", slashedAmount: 0, remindersSent: 1 },
      { status: "late", slashedAmount: 2.5, slashedAt: "2026-07-09T20:05:00.000Z", remindersSent: 2 },
      { status: "grace_period", slashedAmount: 0, remindersSent: 1 },
      { status: "missed", slashedAmount: 5, slashedAt: "2026-07-09T20:05:00.000Z", remindersSent: 2 },
    ]),
    payouts: createMockPayouts([
      { status: "paid", payoutAmount: 50 },
      { status: "ready", payoutAmount: 52.5 },
    ]),
    auditEvents: createMockAuditEvents(),
  };
}

export function createPausedCircleMock(): CreatorDashboardDTO {
  return {
    role: "creator",
    circle: createMockCircle({
      id: "circle-paused-demo",
      name: "Paused Demo Circle",
      status: "paused",
      currentRound: 3,
    }),
    members: createMockMembers(),
    rounds: createMockRounds([
      { status: "completed", collectedAmount: 50 },
      { status: "completed", collectedAmount: 50 },
      { status: "active", collectedAmount: 10, expectedAmount: 50 },
    ]),
    contributions: createMockContributions([
      { status: "paid" },
      { status: "pending" },
      { status: "late" },
      { status: "not_due" },
      { status: "not_due" },
    ]),
    payouts: createMockPayouts([
      { status: "paid" },
      { status: "paid" },
      { status: "delayed" as const },
    ]),
    auditEvents: createMockAuditEvents(),
  };
}

export function createCancelledCircleMock(): CreatorDashboardDTO {
  return {
    role: "creator",
    circle: createMockCircle({
      id: "circle-cancelled-demo",
      name: "Cancelled Demo Circle",
      status: "cancelled",
      currentRound: 2,
    }),
    members: createMockMembers([
      { collateralStatus: "posted", paymentStatus: "paid", slashedAmount: 0 },
      { collateralStatus: "posted", paymentStatus: "paid", slashedAmount: 0 },
      { collateralStatus: "posted", paymentStatus: "pending", slashedAmount: 0 },
      { collateralStatus: "posted", paymentStatus: "not_due", slashedAmount: 0 },
      { collateralStatus: "posted", paymentStatus: "not_due", slashedAmount: 0 },
    ]),
    rounds: createMockRounds([
      { status: "completed", collectedAmount: 50 },
      { status: "disputed", collectedAmount: 20, expectedAmount: 50 },
    ]),
    contributions: createMockContributions([
      { status: "paid", paidAt: "2026-07-08T14:00:00.000Z" },
      { status: "paid", paidAt: "2026-07-08T14:05:00.000Z" },
      { status: "pending" },
      { status: "not_due" },
      { status: "not_due" },
    ]),
    payouts: createMockPayouts([
      { status: "paid", txHash: "tx_cancelled_payout_1" },
      { status: "disputed" },
    ]),
    auditEvents: createMockAuditEvents(),
  };
}

export function createMultiDefaultCircleMock(): CreatorDashboardDTO {
  return {
    role: "creator",
    circle: createMockCircle({
      id: "circle-multi-default",
      name: "Multi-Default Circle",
      status: "delayed",
      currentRound: 2,
    }),
    members: createMockMembers([
      { paymentStatus: "paid", lateCount: 0, restrictionStatus: "clear" },
      { paymentStatus: "late", lateCount: 1, collateralStatus: "partially_slashed", slashedAmount: 2.5, restrictionStatus: "warning" },
      { paymentStatus: "late", lateCount: 1, collateralStatus: "partially_slashed", slashedAmount: 2.5, restrictionStatus: "warning" },
      { paymentStatus: "not_due", lateCount: 0, restrictionStatus: "clear" },
      { paymentStatus: "not_due", lateCount: 0, restrictionStatus: "clear" },
    ]),
    rounds: createMockRounds([
      { status: "completed", collectedAmount: 50 },
      { status: "late", collectedAmount: 10, expectedAmount: 50 },
    ]),
    contributions: createMockContributions([
      { status: "paid", paidAt: "2026-07-08T14:00:00.000Z" },
      { status: "late", slashedAmount: 2.5, remindersSent: 2 },
      { status: "late", slashedAmount: 2.5, remindersSent: 2 },
      { status: "not_due" },
      { status: "not_due" },
    ]),
    payouts: createMockPayouts([
      { status: "paid", payoutAmount: 50 },
      { status: "delayed", payoutAmount: 55 },
    ]),
    auditEvents: createMockAuditEvents(),
  };
}

export function createDisputeResolvedCircleMock(resolvedInFavor: boolean): CreatorDashboardDTO {
  const members = createMockMembers([
    { paymentStatus: "paid", restrictionStatus: "clear" },
    { paymentStatus: "pending", restrictionStatus: "clear" },
    resolvedInFavor
      ? { paymentStatus: "pending", collateralStatus: "posted", slashedAmount: 0, lateCount: 0, restrictionStatus: "clear" }
      : { paymentStatus: "missed", collateralStatus: "fully_slashed", slashedAmount: 5, lateCount: 1, restrictionStatus: "warning" },
    { paymentStatus: "not_due", restrictionStatus: "clear" },
    { paymentStatus: "not_due", restrictionStatus: "clear" },
  ]);

  return {
    role: "creator",
    circle: createMockCircle({
      id: resolvedInFavor ? "circle-dispute-won" : "circle-dispute-lost",
      name: resolvedInFavor ? "Dispute Won Circle" : "Dispute Lost Circle",
      status: "active",
    }),
    members,
    rounds: createMockRounds([
      { status: "completed", collectedAmount: 50 },
      { status: "active", collectedAmount: 30, expectedAmount: 50 },
    ]),
    contributions: createMockContributions([
      { status: "paid" },
      { status: "pending" },
      resolvedInFavor
        ? { status: "pending", slashedAmount: 0, remindersSent: 1 }
        : { status: "missed", slashedAmount: 5, slashedAt: "2026-07-09T20:05:00.000Z", remindersSent: 2 },
      { status: "not_due" },
      { status: "not_due" },
    ]),
    payouts: createMockPayouts([
      { status: "paid" },
      { status: "ready" },
    ]),
    auditEvents: createMockAuditEvents(),
  };
}

export function createMemberDashboardAfterDefaultMock(): MemberDashboardDTO {
  const members = createMockMembers();
  return {
    role: "member",
    circle: createMockCircle({ status: "active", currentRound: 3 }),
    currentMember: {
      ...members[2],
      paymentStatus: "late",
      collateralStatus: "partially_slashed",
      slashedAmount: 2.5,
      lateCount: 2,
      restrictionStatus: "warning",
    },
    members,
    rounds: createMockRounds([
      { status: "completed", collectedAmount: 50 },
      { status: "completed", collectedAmount: 50 },
      { status: "active", collectedAmount: 10, expectedAmount: 50 },
    ]),
    contributions: createMockContributions(),
    payouts: createMockPayouts(),
    auditEvents: createMockAuditEvents(),
    notifications: createMockNotifications(6),
  };
}

export const scenarioFactories = {
  perfect: createPerfectCircleMock,
  defaulted: createDefaultedCircleMock,
  paused: createPausedCircleMock,
  cancelled: createCancelledCircleMock,
  multiDefault: createMultiDefaultCircleMock,
  disputeResolved: createDisputeResolvedCircleMock,
  memberAfterDefault: createMemberDashboardAfterDefaultMock,
} as const;
