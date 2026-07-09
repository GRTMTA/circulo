import { CircleDollarSign } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WalletBalanceDisplay({
  balance,
  asset,
  network,
}: {
  balance: number;
  asset: string;
  network: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle><CircleDollarSign className="size-4 text-primary" /> Stablecoin Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">{balance.toFixed(2)} {asset}</p>
        <p className="mt-2 text-sm text-muted-foreground">On {network} network</p>
      </CardContent>
    </Card>
  );
}

