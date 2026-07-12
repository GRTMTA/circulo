import { AppShell } from "@/components/dashboard/app-shell";
import { getDashboardDTO } from "@/lib/dashboard/queries";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const circles = await getDashboardDTO();
  const authContext = await requireAuthenticatedUser("/dashboard");

  const appShellUser = authContext.user
    ? {
        name: authContext.profile?.full_name || authContext.user.email || "Ari Santos",
        email: authContext.user.email,
        badge: authContext.profile?.full_name ? "Member" : undefined,
      }
    : undefined;

  return (
    <AppShell
      circles={circles}
      user={appShellUser}
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
