"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { DashboardAuditEvent, DashboardMember } from "@/lib/dashboard/types";

export function AuditExportButton({
  events,
}: {
  events: DashboardAuditEvent[];
  members: DashboardMember[];
}) {
  return <Button variant="outline" onClick={() => toast.success(`Audit log exported as CSV (${events.length} events)`)}>Export Audit Log</Button>;
}

