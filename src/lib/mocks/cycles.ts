import type { DashboardRound } from "@/lib/dashboard/types";

export const mockRounds: DashboardRound[] = [
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

export const mockCycleOptions = [
  { label: "24 hour cycle", intervalSeconds: 86_400, contributionAmount: 10 },
  { label: "Weekly cycle", intervalSeconds: 604_800, contributionAmount: 25 },
  { label: "Monthly cycle", intervalSeconds: 2_592_000, contributionAmount: 100 },
] as const;

export function createMockRounds(
  overrides: Partial<DashboardRound>[] = []
): DashboardRound[] {
  return mockRounds.map((round, index) => ({
    ...round,
    ...overrides[index],
  }));
}
