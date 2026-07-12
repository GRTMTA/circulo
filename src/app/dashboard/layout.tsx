import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSpotlightTour } from "@/components/onboarding/dashboard-spotlight-tour";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getDashboardDTO } from "@/lib/dashboard/queries";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [circles, authContext] = await Promise.all([
    getDashboardDTO(),
    requireAuthenticatedUser("/dashboard"),
  ]);

  const appShellUser = authContext.user
    ? {
        name: authContext.profile?.full_name || authContext.user.email || "Ari Santos",
        email: authContext.user.email,
        badge: authContext.profile?.full_name ? "Member" : undefined,
      }
    : undefined;
  const showOnboarding = !authContext.profile?.onboarding_completed_at;

  return (
    <AppShell
      circles={circles}
      user={appShellUser}
      headerActions={<ConnectWalletButton compact />}
      brand={{
        title: "Circulo",
        href: "/dashboard",
        full: <span className="font-heading text-xl">Circulo</span>,
        compact: <span className="font-heading text-lg">C</span>,
      }}
      notificationCount={circles.filter((circle) => circle.myPaymentStatus && circle.myPaymentStatus !== "paid").length}
    >
      {children}
      {showOnboarding ? <DashboardSpotlightTour /> : null}
    </AppShell>
  );
}
