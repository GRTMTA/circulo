"use client";

import { useEffect, useState } from "react";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ExternalLink, 
  History, 
  Loader2, 
  Wallet,
  Coins,
  RefreshCw,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StellarWalletsKit, KitEventType, HORIZON_RPC_URL } from "@/config/stellar";
import type { KitEventStateUpdated } from "@creit.tech/stellar-wallets-kit";
import { toast } from "sonner";

interface StellarPayment {
  id: string;
  type: string;
  from: string;
  to: string;
  asset_type: string;
  asset_code?: string;
  amount: string;
  transaction_hash: string;
  created_at: string;
}

export default function TransactionsPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [payments, setPayments] = useState<StellarPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "in" | "out">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [assetFilter, setAssetFilter] = useState<string>("all");

  useEffect(() => {
    StellarWalletsKit.getAddress()
      .then((res) => setAddress(res?.address ?? null))
      .catch(() => setAddress(null));

    const unsubState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event: KitEventStateUpdated) => {
      setAddress(event?.payload?.address ?? null);
    });

    const unsubDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      setAddress(null);
      setPayments([]);
    });

    return () => {
      unsubState();
      unsubDisconnect();
    };
  }, []);

  async function fetchPayments(walletAddress: string) {
    setLoading(true);
    try {
      const res = await fetch(`${HORIZON_RPC_URL}/accounts/${walletAddress}/payments?limit=40&order=desc`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch on-chain transaction history");
      const data = await res.json();
      const records = data._embedded?.records || [];
      
      const paymentRecords = records.filter((r: any) => 
        ["payment", "create_account", "path_payment_strict_receive", "path_payment_strict_send"].includes(r.type)
      );
      
      setPayments(paymentRecords);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load on-chain transaction history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (address) {
      void fetchPayments(address);
    }
  }, [address]);

  const handleConnect = async () => {
    try {
      const res = await StellarWalletsKit.authModal();
      if (res?.address) setAddress(res.address);
    } catch (err) {
      console.error(err);
    }
  };

  const getAssetLabel = (item: StellarPayment) => {
    if (item.asset_type === "native") return "XLM";
    return item.asset_code || "Unknown Token";
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const filteredPayments = payments.filter((payment) => {
    const isOutflow = payment.from?.toUpperCase() === address?.toUpperCase();
    const isInflow = payment.to?.toUpperCase() === address?.toUpperCase();
    
    if (filterType === "in" && !isInflow) return false;
    if (filterType === "out" && !isOutflow) return false;

    const assetLabel = getAssetLabel(payment);
    if (assetFilter !== "all" && assetLabel !== assetFilter) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const hashMatch = payment.transaction_hash?.toLowerCase().includes(query);
      const fromMatch = payment.from?.toLowerCase().includes(query);
      const toMatch = payment.to?.toLowerCase().includes(query);
      return hashMatch || fromMatch || toMatch;
    }

    return true;
  });

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight flex items-center gap-2.5">
            <History className="size-8 text-[var(--color-primary-default)]" />
            Transaction History
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            View real-time assets going in and out of your connected wallet on the Stellar Testnet.
          </p>
        </div>
        {address ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchPayments(address)}
            disabled={loading}
            className="self-start md:self-auto flex items-center gap-2 border-[var(--color-border-muted)] hover:bg-[var(--color-background-muted)] transition-colors"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Ledger
          </Button>
        ) : null}
      </div>

      {!address ? (
        <Card className="trust-ledger-surface max-w-xl mx-auto text-center py-12 px-6 border-[var(--color-border-muted)] bg-[var(--color-background-muted)]/20 shadow-lg">
          <CardHeader className="pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-[var(--color-primary-muted)]/25 flex items-center justify-center mb-2">
              <Wallet className="size-6 text-[var(--color-primary-default)]" />
            </div>
            <CardTitle className="text-xl">Connect Wallet to View History</CardTitle>
            <CardDescription className="max-w-sm mx-auto">
              Please connect your Stellar wallet using the button below or in the header to load your transaction ledger history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleConnect} className="w-full max-w-xs font-semibold shadow-md bg-gradient-to-r from-[var(--color-primary-default)] to-indigo-600 hover:from-[var(--color-primary-hover)] hover:to-indigo-700">
              Connect Stellar Wallet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-[var(--color-border-muted)] bg-[var(--color-background-muted)]/25 backdrop-blur-sm p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by transaction hash or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-[var(--color-background-default)]/60 border-[var(--color-border-muted)] focus-visible:ring-[var(--color-primary-default)]"
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <Select value={filterType} onValueChange={(val) => setFilterType((val || "all") as any)}>
                  <SelectTrigger className="w-[140px] bg-[var(--color-background-default)]/60 border-[var(--color-border-muted)]">
                    <SelectValue placeholder="Direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Directions</SelectItem>
                    <SelectItem value="in">Inflow (+)</SelectItem>
                    <SelectItem value="out">Outflow (-)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={assetFilter} onValueChange={(val) => setAssetFilter(val || "all")}>
                  <SelectTrigger className="w-[120px] bg-[var(--color-background-default)]/60 border-[var(--color-border-muted)]">
                    <SelectValue placeholder="Asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assets</SelectItem>
                    <SelectItem value="XLM">XLM</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="border-[var(--color-border-muted)] shadow-md overflow-hidden bg-[var(--color-background-default)]/40">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                  <Loader2 className="size-8 animate-spin text-[var(--color-primary-default)]" />
                  <span className="text-sm font-medium">Fetching real-time ledger records...</span>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <Coins className="size-10 text-muted-foreground/60 mx-auto mb-3" />
                  <p className="text-base font-semibold">No Transactions Found</p>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
                    No transactions match your selected search or filters, or this account hasn't made any testnet operations yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border-muted)]">
                  {filteredPayments.map((payment) => {
                    const isOutflow = payment.from?.toUpperCase() === address.toUpperCase();
                    const amountVal = Number(payment.amount || "0");
                    const assetLabel = getAssetLabel(payment);
                    const formattedDate = new Date(payment.created_at).toLocaleString();

                    return (
                      <div 
                        key={payment.id} 
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 hover:bg-[var(--color-background-muted)]/30 transition-colors gap-3.5"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`size-10 rounded-full flex items-center justify-center shrink-0 shadow-inner ${
                            isOutflow 
                              ? "bg-rose-500/10 text-rose-600 border border-rose-500/20" 
                              : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          }`}>
                            {isOutflow ? <ArrowUpRight className="size-5" /> : <ArrowDownLeft className="size-5" />}
                          </div>
                          
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--color-text-default)] capitalize">
                              {payment.type.replace(/_/g, " ")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {isOutflow ? (
                                <>To: <span className="font-mono font-medium text-slate-400">{formatAddress(payment.to)}</span></>
                              ) : (
                                <>From: <span className="font-mono font-medium text-slate-400">{formatAddress(payment.from)}</span></>
                              )}
                              <span className="mx-1.5">•</span>
                              <span>{formattedDate}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pl-14 sm:pl-0">
                          <div className="text-right">
                            <span className={`text-base font-bold tabular-nums ${
                              isOutflow ? "text-rose-600" : "text-emerald-600"
                            }`}>
                              {isOutflow ? "-" : "+"} {amountVal.toFixed(4)}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground ml-1.5 uppercase">
                              {assetLabel}
                            </span>
                          </div>

                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${payment.transaction_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-[var(--color-primary-default)] p-1.5 rounded-lg border border-[var(--color-border-muted)] hover:border-[var(--color-primary-default)] bg-[var(--color-background-default)] shadow-sm hover:shadow transition-all"
                            title="Verify on Stellar Explorer"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
