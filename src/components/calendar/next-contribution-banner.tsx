import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function NextContributionBanner({
  amount,
  asset,
  dueAt,
  status,
}: {
  amount: number;
  asset: string;
  dueAt: string;
  status: "normal" | "soon" | "overdue";
}) {
  return (
    <Alert variant={status === "overdue" ? "destructive" : "default"}>
      <AlertTitle>Next contribution: {amount} {asset}</AlertTitle>
      <AlertDescription>Due {new Date(dueAt).toLocaleString()}</AlertDescription>
    </Alert>
  );
}

