import { AppShell } from "@/components/dashboard/app-shell";
import { getDashboardDTO } from "@/lib/dashboard/queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const circles = await getDashboardDTO();

  return (
    <AppShell
      circles={circles}
      brand={{
        title: "Circulo",
        href: "/dashboard",
        full: <span className="font-heading text-xl">Circulo</span>,
        compact: <span className="font-heading text-lg">C</span>,
      }}
      notificationCount={circles.filter((circle) => circle.myPaymentStatus && circle.myPaymentStatus !== "paid").length}
    >
      {children}
    </AppShell>
  );
}
