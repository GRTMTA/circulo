import type {
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

export * from "@/lib/mocks/audit";
export * from "@/lib/mocks/circles";
export * from "@/lib/mocks/contributions";
export * from "@/lib/mocks/cycles";
export * from "@/lib/mocks/members";
export * from "@/lib/mocks/payouts";

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
