import { notFound } from "next/navigation";

import { CycleCalendarView } from "@/components/calendar/cycle-calendar-view";
import { CycleTimelineView } from "@/components/calendar/cycle-timeline-view";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCircleDTO } from "@/lib/dashboard/queries";
import { createMockCalendarEvents } from "@/lib/mocks";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;
  const data = await getCircleDTO(circleId);

  if (!data) notFound();

  return (
    <DashboardShell
      title="Cycle Calendar"
      description="Contribution due dates, grace periods, and payout windows for this circle."
      breadcrumbItems={[
        { label: "All Circles", href: "/dashboard" },
        { label: data.circle.name, href: `/dashboard/${circleId}` },
        { label: "Calendar" },
      ]}
    >
      <CycleCalendarView
        events={createMockCalendarEvents(circleId, data.rounds, data.payouts, data.contributions)}
      />
      <CycleTimelineView
        rounds={data.rounds}
        payouts={data.payouts}
        contributions={data.contributions}
        members={data.members}
      />
    </DashboardShell>
  );
}

