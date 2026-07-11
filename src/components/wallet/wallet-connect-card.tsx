"use client";

import { Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WalletConnectCard({
  status,
  walletAddress,
}: {
  status: "connected" | "disconnected" | "connecting";
  walletAddress: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle><Wallet className="size-4 text-primary" /> Stellar Wallet</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Badge variant={status === "connected" ? "default" : "secondary"}>{status}</Badge>
        <p className="min-h-6 font-mono text-sm text-muted-foreground">
          {walletAddress ?? "No wallet connected"}
        </p>
        <Button
          variant={status === "connected" ? "outline" : "default"}
          onClick={() => toast.info(status === "connected" ? "Wallet disconnected" : "Wallet connection requested")}
        >
          {status === "connecting" ? <Loader2 className="size-4 animate-spin" /> : null}
          {status === "connected" ? "Disconnect" : "Connect Stellar Wallet"}
        </Button>
      </CardContent>
    </Card>
  );
}

