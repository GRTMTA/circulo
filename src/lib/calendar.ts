import type {
  DashboardContribution,
  DashboardMember,
  DashboardPayout,
  DashboardRound,
} from "@/lib/dashboard/types";

export type CalendarEventType =
  | "contribution_due"
  | "contribution_paid"
  | "contribution_late"
  | "contribution_missed"
  | "payout"
  | "payout_ready"
  | "payout_paid"
  | "grace_start"
  | "grace_end"
  | "collateral_posted"
  | "collateral_slashed"
  | "member_joined"
  | "agreement_accepted"
  | "round_start"
  | "round_end"
  | "reminder_sent";

export interface CalendarEvent {
  id: string;
  date: string;
  type: CalendarEventType;
  title: string;
  description?: string;
  memberId?: string;
  memberName?: string;
  memberAvatarUrl?: string | null;
  roundNumber?: number;
  amount?: number;
  asset?: string;
  status?: string;
  isCurrentUser?: boolean;
  actionLabel?: string;
  actionType?: "pay" | "remind" | "view";
}

export function createCalendarEvents(
  rounds: DashboardRound[],
  payouts: DashboardPayout[],
  contributions: DashboardContribution[],
  members: DashboardMember[],
  currentMemberId?: string,
  asset = "USDC"
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const memberMap = new Map(members.map((member) => [member.id, member]));
  const roundMap = new Map(rounds.map((round) => [round.id, round]));

  for (const round of rounds) {
    if (round.dueAt) {
      events.push({
        id: `due-${round.id}`,
        date: round.dueAt,
        type: "contribution_due",
        title: `Round ${round.roundNumber} contribution due`,
        description: `${members.length} members contribute this round`,
        roundNumber: round.roundNumber,
        amount: round.expectedAmount,
        asset,
        status:
          round.status === "late"
            ? "overdue"
            : round.status === "grace_period"
              ? "grace"
              : "due",
      });

      if (round.status === "late" || round.status === "grace_period") {
        events.push({
          id: `grace-${round.id}`,
          date: new Date(new Date(round.dueAt).getTime() + 4 * 3_600_000).toISOString(),
          type: "grace_end",
          title: "Grace period ends",
          description: "Late payment window closes",
          roundNumber: round.roundNumber,
          status: "warning",
        });
      }
    }
  }

  for (const payout of payouts) {
    const member = payout.recipientMemberId
      ? memberMap.get(payout.recipientMemberId)
      : undefined;
    const type: CalendarEventType =
      payout.status === "paid"
        ? "payout_paid"
        : payout.status === "ready"
          ? "payout_ready"
          : "payout";

    events.push({
      id: `payout-${payout.id}`,
      date: payout.expectedPayoutAt ?? new Date().toISOString(),
      type,
      title: `Round ${payout.roundNumber} payout`,
      description: member ? `${member.displayName} receives payout` : "Payout scheduled",
      memberId: payout.recipientMemberId ?? undefined,
      memberName: member?.displayName,
      memberAvatarUrl: member?.avatarUrl,
      roundNumber: payout.roundNumber,
      amount: payout.payoutAmount,
      asset,
      status: payout.status,
      actionType: payout.status === "ready" ? "view" : undefined,
      actionLabel: payout.status === "ready" ? "View payout" : undefined,
    });
  }

  for (const contribution of contributions) {
    const member = memberMap.get(contribution.memberId);
    const round = roundMap.get(contribution.roundId);
    const isCurrentUser = contribution.memberId === currentMemberId;
    const type: CalendarEventType =
      contribution.status === "paid"
        ? "contribution_paid"
        : contribution.status === "late"
          ? "contribution_late"
          : contribution.status === "missed"
            ? "contribution_missed"
            : "contribution_due";

    events.push({
      id: `contribution-${contribution.id}`,
      date: contribution.paidAt ?? round?.dueAt ?? new Date().toISOString(),
      type,
      title:
        contribution.status === "paid"
          ? `${member?.displayName ?? "Member"} paid`
          : `${member?.displayName ?? "Member"} contribution ${contribution.status.replaceAll("_", " ")}`,
      description: `${contribution.amountDue} ${asset}`,
      memberId: contribution.memberId,
      memberName: member?.displayName,
      memberAvatarUrl: member?.avatarUrl,
      roundNumber: round?.roundNumber,
      amount: contribution.amountDue,
      asset,
      status: contribution.status,
      isCurrentUser,
      actionLabel: isCurrentUser && contribution.status !== "paid" ? "Pay now" : undefined,
      actionType: isCurrentUser && contribution.status !== "paid" ? "pay" : undefined,
    });
  }

  return events.sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()
  );
}

export function createDayEvents(date: Date, events: CalendarEvent[]): CalendarEvent[] {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayEnd = dayStart + 86_400_000;
  return events.filter((event) => {
    const eventTime = new Date(event.date).getTime();
    return eventTime >= dayStart && eventTime < dayEnd;
  });
}