import type { DashboardPayout } from "@/lib/dashboard/types";

export const mockPayouts: DashboardPayout[] = [
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

export function createMockPayouts(
  overrides: Partial<DashboardPayout>[] = []
): DashboardPayout[] {
  return mockPayouts.map((payout, index) => ({
    ...payout,
    ...overrides[index],
  }));
}

export function createMockPayoutsForCircle(
  roundCount: number
): DashboardPayout[] {
  const memberIds = [
    "member-creator",
    "member-b",
    "member-c",
    "member-d",
    "member-e",
    "member-creator",
    "member-b",
  ];

  return Array.from({ length: roundCount }, (_, i) => {
    const base = new Date("2026-07-08T16:00:00.000Z");
    base.setDate(base.getDate() + i);

    const statuses: DashboardPayout["status"][] = [
      "paid",
      "ready",
      "scheduled",
      "delayed",
      "disputed",
    ];

    return {
      id: `payout-${i + 1}`,
      roundNumber: i + 1,
      recipientMemberId: memberIds[i % memberIds.length] ?? null,
      payoutAmount: 50,
      expectedPayoutAt: base.toISOString(),
      withheldAmount: 0,
      status: statuses[Math.min(i, statuses.length - 1)] ?? "scheduled",
      txHash: i === 0 ? "tx_payout_mock" : null,
    };
  });
}
