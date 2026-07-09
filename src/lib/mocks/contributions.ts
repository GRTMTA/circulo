import type { DashboardContribution } from "@/lib/dashboard/types";

export const mockContributions: DashboardContribution[] = [
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

export function createMockContributions(
  overrides: Partial<DashboardContribution>[] = []
): DashboardContribution[] {
  return mockContributions.map((contribution, index) => ({
    ...contribution,
    ...overrides[index],
  }));
}
