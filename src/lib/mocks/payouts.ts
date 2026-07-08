import type { DashboardPayout } from "@/lib/dashboard/types";

export const mockPayouts: DashboardPayout[] = [
  {
    id: "payout-1",
    roundNumber: 1,
    recipientMemberId: "member-creator",
    expectedPayoutAt: "2026-07-08T16:00:00.000Z",
    status: "paid",
    txHash: "tx_payout_91a2",
  },
  {
    id: "payout-2",
    roundNumber: 2,
    recipientMemberId: "member-b",
    expectedPayoutAt: "2026-07-09T16:00:00.000Z",
    status: "ready",
    txHash: null,
  },
  {
    id: "payout-3",
    roundNumber: 3,
    recipientMemberId: "member-c",
    expectedPayoutAt: "2026-07-10T16:00:00.000Z",
    status: "scheduled",
    txHash: null,
  },
  {
    id: "payout-4",
    roundNumber: 4,
    recipientMemberId: "member-d",
    expectedPayoutAt: "2026-07-11T16:00:00.000Z",
    status: "delayed",
    txHash: null,
  },
  {
    id: "payout-5",
    roundNumber: 5,
    recipientMemberId: "member-e",
    expectedPayoutAt: "2026-07-12T16:00:00.000Z",
    status: "disputed",
    txHash: null,
  },
];

const memberIds = [
  "member-creator",
  "member-b",
  "member-c",
  "member-d",
  "member-e",
  "member-creator",
  "member-b",
];

export function createMockPayouts(
  overrides: Partial<DashboardPayout>[] = []
): DashboardPayout[] {
  return mockPayouts.map((payout, index) => ({
    ...payout,
    ...overrides[index],
  }));
}

export function createMockPayoutsForCircle(roundCount: number): DashboardPayout[] {
  return Array.from({ length: roundCount }, (_, index) => ({
    id: `payout-${index + 1}`,
    roundNumber: index + 1,
    recipientMemberId: memberIds[index % memberIds.length],
    expectedPayoutAt: `2026-07-${String(8 + index).padStart(2, "0")}T16:00:00.000Z`,
    status:
      index === 0
        ? "paid"
        : index === 1
          ? "ready"
          : index === roundCount - 1
            ? "disputed"
            : "scheduled",
    txHash: index === 0 ? "tx_payout_91a2" : null,
  }));
}
