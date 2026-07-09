"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WalletAssetSelect({
  options,
  selected,
}: {
  options: { asset: string; network: string }[];
  selected: string;
}) {
  const [asset, setAsset] = useState(selected);

  return (
    <Card>
      <CardHeader><CardTitle>Settlement Asset</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={`${option.asset}-${option.network}`}
            type="button"
            className="rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
            onClick={() => setAsset(option.asset)}
          >
            <Badge variant={asset === option.asset ? "default" : "outline"}>
              {option.asset} · {option.network}
            </Badge>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

