import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { WalletAssetSelect } from "@/components/wallet/wallet-asset-select";
import { WalletBalanceDisplay } from "@/components/wallet/wallet-balance-display";
import { WalletConnectCard } from "@/components/wallet/wallet-connect-card";
import { WalletPayButton } from "@/components/wallet/wallet-pay-button";
import { getCircleDTO } from "@/lib/dashboard/queries";

export default async function WalletPage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;
  const data = await getCircleDTO(circleId);

  if (!data) notFound();

  const currentRound = data.rounds.find(
    (round) => round.roundNumber === data.circle.currentRound
  );

  return (
    <DashboardShell
      title="Wallet & Stablecoin"
      description="Connect a testnet wallet, inspect balances, and prepare contributions."
      breadcrumbItems={[
        { label: "All Circles", href: "/dashboard" },
        { label: data.circle.name, href: `/dashboard/${circleId}` },
        { label: "Wallet" },
      ]}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <WalletConnectCard asset={data.circle.contributionAsset} />
        <WalletBalanceDisplay asset={data.circle.contributionAsset} />
        <WalletAssetSelect
          options={[{ asset: data.circle.contributionAsset, network: "Stellar Testnet" }]}
          selected={data.circle.contributionAsset}
        />
        <WalletPayButton
          circleId={circleId}
          amount={data.circle.contributionAmount}
          asset={data.circle.contributionAsset}
          dueDate={currentRound?.dueAt ?? data.circle.startDate}
          roundNumber={currentRound?.roundNumber}
          status="idle"
        />
      </div>
    </DashboardShell>
  );
}

