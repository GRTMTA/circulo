import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SectionCard, StatCard, formatAmount, formatInterval } from "@/components/dashboard/dashboard-views";
import { getCircleDTO } from "@/lib/dashboard/queries";
import { CalendarDays, LockKeyhole, PiggyBank, Settings } from "lucide-react";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;
  const data = await getCircleDTO(circleId);

  if (!data || data.role !== "creator") notFound();

  return (
    <DashboardShell
      title="Pool Settings"
      description="Financial settings lock after activation; only non-financial metadata stays editable."
      breadcrumbItems={[
        { label: "All Circles", href: "/dashboard" },
        { label: data.circle.name, href: `/dashboard/${circleId}` },
        { label: "Settings" },
      ]}
    >
      <SectionCard title="Locked settings">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Contribution" value={formatAmount(data.circle.contributionAmount, data.circle.contributionAsset)} icon={PiggyBank} />
          <StatCard label="Interval" value={formatInterval(data.circle.intervalSeconds)} icon={CalendarDays} />
          <StatCard label="Collateral" value={formatAmount(data.circle.collateralAmount, data.circle.contributionAsset)} icon={LockKeyhole} />
          <StatCard label="Settings" value={data.circle.settingsLocked ? "Locked" : "Draft editable"} icon={Settings} />
        </div>
      </SectionCard>
    </DashboardShell>
  );
}

