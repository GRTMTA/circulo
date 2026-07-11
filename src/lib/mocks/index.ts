import type {
  CircleEnrichedDTO,
  CirclesDTO,
  CreatorDashboardDTO,
  DashboardDTO,
  MemberDashboardDTO,
} from "@/lib/dashboard/types";
import { createMockAuditEvents, mockNotifications } from "@/lib/mocks/audit";
import { createMockCircle } from "@/lib/mocks/circles";
import { createMockContributions } from "@/lib/mocks/contributions";
import { createMockMembers } from "@/lib/mocks/members";
import { createMockPayouts } from "@/lib/mocks/payouts";
import { createMockRounds } from "@/lib/mocks/cycles";
import { createMockCirclesList } from "@/lib/mocks/circles-list";

export * from "@/lib/mocks/audit";
export * from "@/lib/mocks/agreement";
export * from "@/lib/mocks/calendar";
export * from "@/lib/mocks/circles";
export * from "@/lib/mocks/circles-list";
export * from "@/lib/mocks/contributions";
export * from "@/lib/mocks/create-states";
export * from "@/lib/mocks/cycles";
export * from "@/lib/mocks/emergency";
export * from "@/lib/mocks/members";
export * from "@/lib/mocks/payouts";
export * from "@/lib/mocks/protection";
export * from "@/lib/mocks/scenarios";
export * from "@/lib/mocks/wallet";

export function createCreatorDashboardMock(
  overrides: Partial<CreatorDashboardDTO> = {}
): CreatorDashboardDTO {
  return {
    role: "creator",
    circle: createMockCircle(),
    members: createMockMembers(),
    rounds: createMockRounds(),
    contributions: createMockContributions(),
    payouts: createMockPayouts(),
    auditEvents: createMockAuditEvents(),
    ...overrides,
  };
}

export function createMemberDashboardMock(
  overrides: Partial<MemberDashboardDTO> = {}
): MemberDashboardDTO {
  const members = createMockMembers();
  const currentMember = members[2];

  return {
    role: "member",
    circle: createMockCircle({
      status: "active",
    }),
    currentMember,
    members,
    rounds: createMockRounds(),
    contributions: createMockContributions(),
    payouts: createMockPayouts(),
    auditEvents: createMockAuditEvents(),
    notifications: mockNotifications,
    ...overrides,
  };
}

export function createEmptyDashboardMock(configured = true): DashboardDTO {
  return {
    role: "empty",
    configured,
  };
}

export function createCirclesListMock(count = 5): CirclesDTO {
  return createMockCirclesList(count);
}

export function createCircleMock(circleId: string): CircleEnrichedDTO {
  const circleListItem = createMockCirclesList(8).find((circle) => circle.id === circleId);

  if (circleListItem?.role === "member") {
    return createMemberDashboardMock({
      circle: createMockCircle({
        id: circleListItem.id,
        name: circleListItem.name,
        status: circleListItem.status,
        contributionAmount: circleListItem.contributionAmount,
        contributionAsset: circleListItem.contributionAsset,
        memberCount: circleListItem.memberCount,
        currentRound: circleListItem.currentRound,
        totalRounds: circleListItem.totalRounds,
      }),
    });
  }

  return createCreatorDashboardMock({
    circle: createMockCircle(
      circleListItem
        ? {
            id: circleListItem.id,
            name: circleListItem.name,
            status: circleListItem.status,
            contributionAmount: circleListItem.contributionAmount,
            contributionAsset: circleListItem.contributionAsset,
            memberCount: circleListItem.memberCount,
            currentRound: circleListItem.currentRound,
            totalRounds: circleListItem.totalRounds,
          }
        : { id: circleId }
    ),
  });
}
