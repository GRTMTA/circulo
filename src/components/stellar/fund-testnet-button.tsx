"use client";

import { useState } from "react";
import { Coins, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { fundWithFriendbot } from "@/lib/stellar-testnet";

/**
 * One-click Friendbot funding for a connected testnet wallet. Removes the
 * biggest first-run blocker: a brand-new wallet with 0 XLM can't sign anything.
 */
export function FundTestnetButton({
  address,
  onFunded,
  variant = "outline",
  size = "sm",
}: {
  address: string | null;
  onFunded?: () => void;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  const [loading, setLoading] = useState(false);

  async function handleFund() {
    if (!address) {
      toast.error("Connect a testnet wallet first.");
      return;
    }
    setLoading(true);
    try {
      const result = await fundWithFriendbot(address);
      if (result.success) {
        toast.success(result.message);
        onFunded?.();
      } else {
        toast.info(result.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} size={size} disabled={loading || !address} onClick={handleFund}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Coins className="size-4" />}
      {loading ? "Funding..." : "Fund testnet XLM"}
    </Button>
  );
}
