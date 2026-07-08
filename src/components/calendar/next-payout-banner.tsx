import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function NextPayoutBanner({
  recipientName,
  amount,
  asset,
  expectedAt,
}: {
  recipientName: string;
  amount: number;
  asset: string;
  expectedAt: string;
}) {
  return (
    <Alert>
      <AlertTitle>Next payout: {recipientName}</AlertTitle>
      <AlertDescription>{recipientName} receives {amount} {asset} on {new Date(expectedAt).toLocaleString()}.</AlertDescription>
    </Alert>
  );
}

