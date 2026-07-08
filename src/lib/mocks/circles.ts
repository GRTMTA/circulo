import type { DashboardCircle } from "@/lib/dashboard/types";

export const mockCircleStatuses = [
  "draft",
  "active",
  "delayed",
  "completed",
  "disputed",
  "cancelled",
] as const;

export const baseMockCircle: DashboardCircle = {
  id: "circle-makati-friday",
  name: "Makati Friday Circle",
  status: "active",
  contributionAmount: 10,
  contributionAsset: "USDC",
  intervalSeconds: 86_400,
  memberCount: 5,
  collateralAmount: 5,
  currentRound: 2,
  totalRounds: 5,
  startDate: "2026-07-08T12:00:00.000Z",
  settingsLocked: true,
  payoutOrderLocked: true,
  rulesLocked: true,
};

export function createMockCircle(
  overrides: Partial<DashboardCircle> = {}
): DashboardCircle {
  return {
    ...baseMockCircle,
    ...overrides,
  };
}

export const mockCirclesByStatus = mockCircleStatuses.map((status) =>
  createMockCircle({
    id: `circle-${status}`,
    name: `${status.charAt(0).toUpperCase()}${status.slice(1)} Circle`,
    status,
    settingsLocked: status !== "draft",
    payoutOrderLocked: status !== "draft",
    rulesLocked: status !== "draft",
  })
);
