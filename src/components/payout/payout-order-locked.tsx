import { PayoutTimeline } from "@/components/dashboard/dashboard-views";
import type { DashboardMember, DashboardPayout } from "@/lib/dashboard/types";

export function PayoutOrderLocked({
  payouts,
  members,
}: {
  payouts: DashboardPayout[];
  members: DashboardMember[];
}) {
  return <PayoutTimeline payouts={payouts} members={members} />;
}

