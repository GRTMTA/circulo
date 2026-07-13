import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CreateWizardShell } from "@/components/create/create-wizard-shell";

import { requireAuthenticatedUser } from "@/lib/auth";

export default async function CreateCirclePage() {
  const authContext = await requireAuthenticatedUser("/dashboard/create");
  const creatorName = authContext.profile?.full_name || authContext.user?.email?.split("@")[0] || "Ari Santos";

  return (
    <DashboardShell
      title="Create a Circle"
      description="Set up your invite-only rotating savings circle."
      breadcrumbItems={[{ label: "All Circles", href: "/dashboard" }, { label: "Create" }]}
    >
      <CreateWizardShell defaultCreatorName={creatorName} />
    </DashboardShell>
  );
}

