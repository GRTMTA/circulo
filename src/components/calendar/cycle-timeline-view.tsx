import { Badge } from "@/components/ui/badge";
import type { DashboardContribution, DashboardMember, DashboardPayout, DashboardRound } from "@/lib/dashboard/types";

function memberName(members: DashboardMember[], id: string | null) {
  return members.find((member) => member.id === id)?.displayName ?? "Unassigned";
}

export function CycleTimelineView({
  rounds,
  payouts,
  members,
}: {
  rounds: DashboardRound[];
  payouts: DashboardPayout[];
  contributions: DashboardContribution[];
  members: DashboardMember[];
}) {
  return (
    <div className="grid gap-3">
      {rounds.map((round) => {
        const payout = payouts.find((item) => item.roundNumber === round.roundNumber);
        return (
          <div key={round.id} className="grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-[auto_1fr_auto]">
            <Badge>Round {round.roundNumber}</Badge>
            <div>
              <p className="font-semibold">{memberName(members, payout?.recipientMemberId ?? null)}</p>
              <p className="mt-1 text-sm text-muted-foreground">Due {round.dueAt ? new Date(round.dueAt).toLocaleString() : "not scheduled"}</p>
            </div>
            <Badge variant={round.status === "late" || round.status === "disputed" ? "destructive" : "outline"}>{round.status}</Badge>
          </div>
        );
      })}
    </div>
  );
}

