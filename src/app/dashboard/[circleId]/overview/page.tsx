import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCircleDTO } from "@/lib/dashboard/queries";

export const dynamic = "force-dynamic";

export default async function CircleOverviewPage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;
  const data = await getCircleDTO(circleId);

  if (!data) notFound();

  return (
    <DashboardShell
      title="Overview"
      description={`Overview information for ${data.circle.name}.`}
      breadcrumbItems={[
        { label: "All Circles", href: "/dashboard" },
        { label: data.circle.name, href: `/dashboard/${circleId}` },
        { label: "Overview" },
      ]}
    >
      <div className="min-h-[50vh] rounded-[16px] border border-dashed border-[var(--color-border)] bg-white p-10 flex items-center justify-center text-muted-foreground text-sm">
        Overview content is currently empty.
      </div>
    </DashboardShell>
  );
}
