import { Progress, ProgressLabel } from "@/components/ui/progress";

export function SlashProgress({
  totalCollateral,
  slashedAmount,
  remainingAmount,
  status,
}: {
  totalCollateral: number;
  slashedAmount: number;
  remainingAmount: number;
  status: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <Progress value={totalCollateral > 0 ? (slashedAmount / totalCollateral) * 100 : 0}>
        <ProgressLabel>Collateral slashed</ProgressLabel>
        <span className="ml-auto text-sm tabular-nums">{slashedAmount} / {totalCollateral} USDC</span>
      </Progress>
      <p className="mt-3 text-sm text-muted-foreground">{remainingAmount} USDC remaining · {status}</p>
    </div>
  );
}

