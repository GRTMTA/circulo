import type { CircleListItem, CirclesDTO } from "@/lib/dashboard/types";

export const mockCirclesListItem: CircleListItem = {
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
  mockCirclesListItem,
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

export function createMockCirclesList(count = 5): CirclesDTO {
  return Array.from({ length: count }, (_, index) => {
    const seed = circleSeeds[index % circleSeeds.length];
    return index < circleSeeds.length
      ? seed
      : {
          ...seed,
          id: `${seed.id}-${index + 1}`,
          name: `${seed.name} ${index + 1}`,
        };
  });
}

