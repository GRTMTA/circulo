import { notFound } from "next/navigation";

import { MemberAgreementScreen } from "@/components/agreement/member-agreement-screen";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCircleDTO } from "@/lib/dashboard/queries";
import { mockAgreementRules } from "@/lib/mocks";

export default async function AgreementPage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;
  const data = await getCircleDTO(circleId);

  if (!data) notFound();

  return (
    <DashboardShell
      title="Rules & Agreement"
      description="Members accept locked circle rules before joining."
      breadcrumbItems={[
        { label: "All Circles", href: "/dashboard" },
        { label: data.circle.name, href: `/dashboard/${circleId}` },
        { label: "Agreement" },
      ]}
    >
      <MemberAgreementScreen circleId={circleId} circleName={data.circle.name} rules={mockAgreementRules} />
    </DashboardShell>
  );
}

