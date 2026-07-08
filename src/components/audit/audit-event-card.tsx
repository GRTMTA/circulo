import { FileClock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { DashboardAuditEvent } from "@/lib/dashboard/types";

export function AuditEventCard({
  event,
  memberName,
}: {
  event: DashboardAuditEvent;
  memberName: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold"><FileClock className="mr-2 inline size-4 text-primary" />{event.eventType}</p>
        <Badge variant="outline">{new Date(event.createdAt).toLocaleString()}</Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{memberName}{event.roundNumber ? ` · Round ${event.roundNumber}` : ""}</p>
      {event.txHash ? <p className="mt-2 font-mono text-xs">{event.txHash}</p> : null}
    </div>
  );
}

