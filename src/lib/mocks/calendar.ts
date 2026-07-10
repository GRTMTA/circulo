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
  currentMemberId?: string
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const memberMap = new Map(members.map((m) => [m.id, m]));

  rounds.forEach((round) => {
    if (round.dueAt) {
      events.push({
        id: `due-${round.id}`,
        date: round.dueAt,
        type: "contribution_due",
        title: `Round ${round.roundNumber} contribution due`,
        description: `${memberMap.size} members contribute ${round.expectedAmount / memberMap.size} each`,
        roundNumber: round.roundNumber,
        amount: round.expectedAmount,
        status: round.status === "late" ? "overdue" : round.status === "grace_period" ? "grace" : "due",
      });

      if (round.status === "late" || round.status === "grace_period") {
        events.push({
          id: `grace-${round.id}`,
          date: new Date(new Date(round.dueAt).getTime() + 4 * 3600000).toISOString(),
          type: "grace_end",
          title: "Grace period ends",
          description: "Late payment window closes",
          roundNumber: round.roundNumber,
          status: "warning",
        });
      }
    }

    events.push({
      id: `round-start-${round.id}`,
      date: round.dueAt ?? new Date().toISOString(),
      type: "round_start" as CalendarEventType,
      title: `Round ${round.roundNumber} started`,
      memberId: round.payoutMemberId ?? undefined,
      memberName: round.payoutMemberId
        ? memberMap.get(round.payoutMemberId)?.displayName ?? undefined
        : undefined,
      memberAvatarUrl: round.payoutMemberId
        ? memberMap.get(round.payoutMemberId)?.avatarUrl ?? null
        : null,
      roundNumber: round.roundNumber,
    });
  });

  payouts.forEach((payout) => {
    const member = payout.recipientMemberId ? memberMap.get(payout.recipientMemberId) : null;
    const eventType: CalendarEventType =
      payout.status === "paid" ? "payout_paid" : payout.status === "ready" ? "payout_ready" : "payout";

    events.push({
      id: `payout-${payout.id}`,
      date: payout.expectedPayoutAt ?? new Date().toISOString(),
      type: eventType,
      title: `Round ${payout.roundNumber} payout`,
      description: member
        ? `${member.displayName} receives payout`
        : "Payout scheduled",
      memberId: payout.recipientMemberId ?? undefined,
      memberName: member?.displayName,
      memberAvatarUrl: member?.avatarUrl ?? null,
      roundNumber: payout.roundNumber,
      status: payout.status,
      actionType: payout.status === "ready" ? "view" : undefined,
      actionLabel: payout.status === "ready" ? "View payout" : undefined,
    });
  });

  contributions.forEach((contribution) => {
    const member = memberMap.get(contribution.memberId);
    const isCurrent = currentMemberId ? contribution.memberId === currentMemberId : false;
    let eventType: CalendarEventType = "contribution_due";

    if (contribution.status === "paid" && contribution.paidAt) {
      eventType = "contribution_paid";
    } else if (contribution.status === "late") {
      eventType = "contribution_late";
    } else if (contribution.status === "missed") {
      eventType = "contribution_missed";
    }

    events.push({
      id: `contrib-${contribution.id}`,
      date: contribution.paidAt ?? contribution.memberId ? new Date().toISOString() : new Date().toISOString(),
      type: eventType,
      title: contribution.status === "paid"
        ? `${member?.displayName ?? "Member"} paid`
        : `${member?.displayName ?? "Member"} contribution ${contribution.status.replace(/_/g, " ")}`,
      description: `${contribution.amountDue} USDC`,
      memberId: contribution.memberId,
      memberName: member?.displayName,
      memberAvatarUrl: member?.avatarUrl ?? null,
      amount: contribution.amountDue,
      asset: "USDC",
      status: contribution.status,
      isCurrentUser: isCurrent,
      actionLabel: isCurrent && contribution.status !== "paid" ? "Pay now" : undefined,
      actionType: isCurrent && contribution.status !== "paid" ? "pay" : undefined,
    });
  });

  return events.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function createDayEvents(date: Date, allEvents: CalendarEvent[]): CalendarEvent[] {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayEnd = dayStart + 86400000;
  return allEvents.filter((event) => {
    const eventTime = new Date(event.date).getTime();
    return eventTime >= dayStart && eventTime < dayEnd;
  });
}

export function createMockFullCycleEvents(): CalendarEvent[] {
  const now = new Date();
  const events: CalendarEvent[] = [];
  const names = ["Ari", "Bea", "Carlo", "Dina", "Enzo"];

  for (let round = 1; round <= 5; round++) {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + (round - 1) * 3);

    events.push({
      id: `mock-due-${round}`,
      date: dueDate.toISOString(),
      type: "contribution_due",
      title: `Round ${round} contribution due`,
      description: "All members contribute 10 USDC",
      roundNumber: round,
      amount: 50,
      asset: "USDC",
      status: round <= 2 ? "completed" : round === 3 ? "active" : "scheduled",
    });

    const payoutDate = new Date(dueDate);
    payoutDate.setHours(payoutDate.getHours() + 4);

    events.push({
      id: `mock-payout-${round}`,
      date: payoutDate.toISOString(),
      type: round <= 2 ? "payout_paid" : round === 3 ? "payout_ready" : "payout",
      title: `Round ${round} payout`,
      description: `${names[names.length - 1 - (round - 1)]} receives 50 USDC`,
      memberName: names[names.length - 1 - (round - 1)],
      memberAvatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${names[names.length - 1 - (round - 1)]}`,
      roundNumber: round,
      status: round <= 2 ? "paid" : round === 3 ? "ready" : "scheduled",
    });

    if (round === 3) {
      const graceDate = new Date(dueDate);
      graceDate.setHours(graceDate.getHours() + 8);
      events.push({
        id: `mock-grace-end-${round}`,
        date: graceDate.toISOString(),
        type: "grace_end",
        title: "Grace period ends",
        description: "Late Carlo must pay or face slash",
        memberName: "Carlo",
        memberAvatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Carlo",
        roundNumber: round,
        status: "warning",
      });
    }

    names.forEach((name, idx) => {
      const status = round < 3 ? "paid" : round === 3 && idx === 2 ? "late" : "pending";
      events.push({
        id: `mock-contrib-${round}-${idx}`,
        date: status === "paid" ? new Date(dueDate.getTime() - 3600000).toISOString() : dueDate.toISOString(),
        type: status === "paid" ? "contribution_paid" : status === "late" ? "contribution_late" : "contribution_due",
        title: status === "paid" ? `${name} paid 10 USDC` : `${name} 10 USDC ${status}`,
        memberName: name,
        memberAvatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${name}`,
        roundNumber: round,
        amount: 10,
        asset: "USDC",
        status,
        actionLabel: status !== "paid" ? "Pay now" : undefined,
        actionType: status !== "paid" ? "pay" : undefined,
      });
    });
  }

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function createMockEmptyCalendarEvents(): CalendarEvent[] {
  return [];
}

export function createMockCalendarForMonth(events: CalendarEvent[], month: Date): CalendarEvent[] {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
  return events.filter((event) => {
    const eventTime = new Date(event.date).getTime();
    return eventTime >= monthStart.getTime() && eventTime <= monthEnd.getTime();
  });
}
