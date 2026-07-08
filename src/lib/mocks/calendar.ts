import type {
  DashboardContribution,
  DashboardPayout,
  DashboardRound,
} from "@/lib/dashboard/types";

export type CalendarEventType = "contribution_due" | "payout" | "grace_end";

export interface MockCalendarEvent {
  date: string;
  type: CalendarEventType;
  label: string;
  memberId?: string;
}

export const mockCalendarEvents: MockCalendarEvent[] = [
  {
    date: "2026-07-08T12:00:00.000Z",
    type: "contribution_due",
    label: "Round 2 contribution due",
  },
  {
    date: "2026-07-08T16:00:00.000Z",
    type: "payout",
    label: "Round 2 payout scheduled",
    memberId: "member-b",
  },
  {
    date: "2026-07-08T20:00:00.000Z",
    type: "grace_end",
    label: "Grace period ends",
    memberId: "member-c",
  },
];

export function createMockCalendarEvents(
  _circleId: string,
  rounds: DashboardRound[],
  payouts: DashboardPayout[],
  contributions: DashboardContribution[]
): MockCalendarEvent[] {
  const dueEvents = rounds
    .filter((round) => round.dueAt)
    .map((round) => ({
      date: round.dueAt as string,
      type: "contribution_due" as const,
      label: `Round ${round.roundNumber} contribution due`,
      memberId: round.payoutMemberId ?? undefined,
    }));

  const payoutEvents = payouts
    .filter((payout) => payout.expectedPayoutAt)
    .map((payout) => ({
      date: payout.expectedPayoutAt as string,
      type: "payout" as const,
      label: `Round ${payout.roundNumber} payout ${payout.status}`,
      memberId: payout.recipientMemberId ?? undefined,
    }));

  const graceEvents = contributions
    .filter((contribution) => contribution.status === "grace_period")
    .map((contribution) => ({
      date: "2026-07-08T20:00:00.000Z",
      type: "grace_end" as const,
      label: "Grace period ending",
      memberId: contribution.memberId,
    }));

  return [...dueEvents, ...payoutEvents, ...graceEvents];
}

