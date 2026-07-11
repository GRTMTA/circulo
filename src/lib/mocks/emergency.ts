import { createMockAuditEvents } from "@/lib/mocks/audit";
import { createMockCircle } from "@/lib/mocks/circles";
import { createMockContributions } from "@/lib/mocks/contributions";
import { createMockRounds } from "@/lib/mocks/cycles";
import { createMockMembers } from "@/lib/mocks/members";
import { createMockPayouts } from "@/lib/mocks/payouts";

export const mockPausedCircle = {
  role: "creator" as const,
  circle: createMockCircle({ status: "disputed" }),
  members: createMockMembers(),
  rounds: createMockRounds(),
  contributions: createMockContributions(),
  payouts: createMockPayouts(),
  auditEvents: createMockAuditEvents(),
};

export const mockCancelledCircle = {
  ...mockPausedCircle,
  circle: createMockCircle({ status: "cancelled" }),
};

export const mockDisputeReasons = [
  "Payment failure",
  "Fraud suspected",
  "Disaster",
  "Member unresponsive",
];
