import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MemberTable } from "@/components/dashboard/dashboard-views";
import { getCircleDTO } from "@/lib/dashboard/queries";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;
  const data = await getCircleDTO(circleId);

  if (!data || data.role !== "creator") notFound();

  return (
    <DashboardShell
      title="Members & Invites"
      description="Creator-only roster, wallet, collateral, agreement, and restriction status."
      breadcrumbItems={[
        { label: "All Circles", href: "/dashboard" },
        { label: data.circle.name, href: `/dashboard/${circleId}` },
        { label: "Members" },
      ]}
    >
      <MemberTable members={data.members} />
    </DashboardShell>
  );
}

