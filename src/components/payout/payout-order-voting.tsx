import { EmptyState } from "@/components/ui/empty-state";

export function PayoutOrderVoting({ enabled }: { circleId: string; enabled: boolean }) {
  return (
    <EmptyState
      title={enabled ? "Voting setup is pending" : "Voting is not yet available"}
      description="For now, the pool creator sets the payout order before activation."
    />
  );
}

