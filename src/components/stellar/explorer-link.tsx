import { ArrowUpRight } from "lucide-react";

import { explorerTxUrl, explorerAccountUrl } from "@/lib/stellar-testnet";
import { cn } from "@/lib/utils";

function shorten(value: string, lead = 6, tail = 4) {
  if (value.length <= lead + tail) return value;
  return `${value.slice(0, lead)}...${value.slice(-tail)}`;
}

/** Renders a shortened tx hash / account as a link to the testnet explorer. */
export function ExplorerLink({
  value,
  kind = "tx",
  className,
  label,
}: {
  value: string | null | undefined;
  kind?: "tx" | "account";
  className?: string;
  label?: string;
}) {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }

  const href = kind === "tx" ? explorerTxUrl(value) : explorerAccountUrl(value);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 font-mono text-sm text-primary underline-offset-4 hover:underline",
        className
      )}
      title={`View on Stellar Expert: ${value}`}
    >
      {label ?? shorten(value)}
      <ArrowUpRight className="size-3" />
    </a>
  );
}
