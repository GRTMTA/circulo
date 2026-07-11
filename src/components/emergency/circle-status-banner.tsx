import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function CircleStatusBanner({ status }: { status: "paused" | "cancelled" | "disputed" }) {
  const copy = {
    paused: "This circle is paused. Contributions and payouts are halted.",
    cancelled: "This circle has been cancelled.",
    disputed: "This circle has a disputed status.",
  };

  return (
    <Alert variant={status === "cancelled" ? "destructive" : "default"}>
      <AlertTitle>{status}</AlertTitle>
      <AlertDescription>{copy[status]}</AlertDescription>
    </Alert>
  );
}

