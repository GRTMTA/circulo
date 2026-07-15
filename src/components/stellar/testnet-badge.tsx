import { FlaskConical } from "lucide-react";

import { env } from "@/lib/env";
import { explorerContractUrl } from "@/lib/stellar-testnet";
import { cn } from "@/lib/utils";

/**
 * Persistent "Testnet" indicator that also links to the deployed Circulo
 * contract on the explorer. Doubles as a config sanity check.
 */
export function TestnetBadge({ className }: { className?: string }) {
  const contractId = env.contractId;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600",
        className
      )}
    >
      <FlaskConical className="size-3.5" />
      <span>Stellar Testnet</span>
      {contractId ? (
        <a
          href={explorerContractUrl(contractId)}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 font-mono text-[10px] text-amber-700/80 underline-offset-2 hover:underline"
          title={`Circulo contract: ${contractId}`}
        >
          {contractId.slice(0, 4)}...{contractId.slice(-4)}
        </a>
      ) : null}
    </div>
  );
}
