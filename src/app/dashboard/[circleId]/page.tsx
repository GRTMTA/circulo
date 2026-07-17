import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardViews } from "@/components/dashboard/dashboard-views";
import { getCircleDTO } from "@/lib/dashboard/queries";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function CircleDashboardPage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;
  const data = await getCircleDTO(circleId);

  if (!data) notFound();

  const tabs = data.role === "creator"
    ? [
        ["overview", "Overview"],
        ["members", "Members & Collateral"],
        ["audit", "Audit Log"],
        ["calendar", "Cycle Calendar"],
        ["agreement", "Agreement"],
        ["settings", "Settings"],
      ]
    : [
        ["overview", "Overview"],
        ["transactions", "Transactions"],
        ["calendar", "Cycle Calendar"],
        ["audit", "Audit Log"],
        ["collateral", "Collateral & Agreement"],
        ["settings", "Settings"],
      ];

  return (
    <Tabs defaultValue="overview" className="flex flex-col gap-6 w-full">
      <div className="border-b border-[var(--color-border-muted)] bg-transparent pb-1">
        <TabsList className="max-w-full overflow-x-auto" variant="line">
          {tabs.map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <DashboardShell
        title={data.circle.name}
        description={data.role === "creator" ? "Creator Dashboard" : "Member Dashboard"}
      >
        <DashboardViews data={data} isTabContentOnly />
      </DashboardShell>
    </Tabs>
  );
}
