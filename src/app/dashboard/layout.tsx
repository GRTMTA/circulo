import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSpotlightTour } from "@/components/onboarding/dashboard-spotlight-tour";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getDashboardDTO, getUserNotifications } from "@/lib/dashboard/queries";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { WalletProvider } from "@/components/wallet/wallet-context";
import { NotificationCenter } from "@/components/dashboard/notification-center";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [circles, authContext, notifications] = await Promise.all([
    getDashboardDTO(),
    requireAuthenticatedUser("/dashboard"),
    getUserNotifications(),
  ]);

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
    <WalletProvider>
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
        notificationSlot={<NotificationCenter notifications={notifications} />}
      >
        {children}
        {showOnboarding ? <DashboardSpotlightTour /> : null}
      </AppShell>
    </WalletProvider>
  );
}
