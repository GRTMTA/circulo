import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CreateWizardShell } from "@/components/create/create-wizard-shell";

export default function CreateCirclePage() {
  return (
    <DashboardShell
      title="Create a Circle"
      description="Set up your invite-only rotating savings circle."
      breadcrumbItems={[{ label: "All Circles", href: "/dashboard" }, { label: "Create" }]}
    >
      <CreateWizardShell />
    </DashboardShell>
  );
}

