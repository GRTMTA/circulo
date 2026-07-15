import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSpotlightTour } from "@/components/onboarding/dashboard-spotlight-tour";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getDashboardDTO } from "@/lib/dashboard/queries";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import Image from "next/image";

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

  console.log("DashboardLayout - authContext.profile:", authContext.profile);

  const appShellUser = authContext.user
    ? {
        name: authContext.profile?.full_name || authContext.user.user_metadata?.full_name || authContext.user.email || "Ari Santos",
        email: authContext.user.email,
        badge: authContext.profile?.full_name ? "Member" : undefined,
        description: authContext.profile?.username || undefined,
        username: authContext.profile?.username,
        walletAddress: authContext.profile?.wallet_address,
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
        full: <Image src="/logo.jpg" alt="Circulo" width={128} height={48} className="h-8 w-auto object-contain" priority />,
        compact: <Image src="/logo.jpg" alt="Circulo" width={40} height={40} className="h-8 w-8 rounded-lg object-cover object-left" priority />,
      }}
      notificationCount={circles.filter((circle) => circle.myPaymentStatus && circle.myPaymentStatus !== "paid").length}
    >
      {children}
      {showOnboarding ? <DashboardSpotlightTour /> : null}
    </AppShell>
  );
}
