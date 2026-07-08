import { DashboardViews } from "@/components/dashboard/dashboard-views";
import { getDashboardDTO } from "@/lib/dashboard/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const dashboard = await getDashboardDTO();

  return <DashboardViews data={dashboard} />;
}
