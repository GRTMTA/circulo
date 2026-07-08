import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { WalletAssetSelect } from "@/components/wallet/wallet-asset-select";
import { WalletBalanceDisplay } from "@/components/wallet/wallet-balance-display";
import { WalletConnectCard } from "@/components/wallet/wallet-connect-card";
import { WalletPayButton } from "@/components/wallet/wallet-pay-button";
import { getCircleDTO } from "@/lib/dashboard/queries";
import { mockStablecoinOptions, mockWalletBalance, mockWalletConnected } from "@/lib/mocks";

export default async function WalletPage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;
  const data = await getCircleDTO(circleId);

  if (!data) notFound();

  return (
    <DashboardShell
      title="Wallet & Stablecoin"
      description="Connect wallet, inspect balance, and prepare contribution payment."
      breadcrumbItems={[
        { label: "All Circles", href: "/dashboard" },
        { label: data.circle.name, href: `/dashboard/${circleId}` },
        { label: "Wallet" },
      ]}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <WalletConnectCard
          status={mockWalletConnected.status}
          walletAddress={mockWalletConnected.walletAddress}
        />
        <WalletBalanceDisplay {...mockWalletBalance} />
        <WalletAssetSelect options={mockStablecoinOptions} selected={data.circle.contributionAsset} />
        <WalletPayButton
          amount={data.circle.contributionAmount}
          asset={data.circle.contributionAsset}
          dueDate="2026-07-09T12:00:00.000Z"
          status="idle"
        />
      </div>
    </DashboardShell>
  );
}

