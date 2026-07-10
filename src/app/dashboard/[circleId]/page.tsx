import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardViews } from "@/components/dashboard/dashboard-views";
import { getCircleDTO } from "@/lib/dashboard/queries";

export const dynamic = "force-dynamic";

export default async function CircleDashboardPage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;
  const data = await getCircleDTO(circleId);

  if (!data) notFound();

  return (
    <DashboardShell
      title={data.role === "creator" ? "Creator dashboard" : "Member dashboard"}
      description={`${data.circle.name} keeps the fixed roster, contribution rules, and payout order visible.`}
      breadcrumbItems={[
        { label: "All Circles", href: "/dashboard" },
        { label: data.circle.name },
      ]}
    >
      <DashboardViews data={data} />
    </DashboardShell>
  );
}

