import { CircleList } from "@/components/dashboard/circle-list";
import { getDashboardDTO } from "@/lib/dashboard/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const dashboard = await getDashboardDTO();

  return <CircleList circles={dashboard} />;
}
