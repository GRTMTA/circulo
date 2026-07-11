"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DashboardMember } from "@/lib/dashboard/types";

export function AuditFilterBar({
  eventTypes,
  members,
}: {
  eventTypes: string[];
  members: DashboardMember[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white p-3">
      {eventTypes.slice(0, 5).map((eventType) => <Badge key={eventType} variant="outline">{eventType}</Badge>)}
      {members.slice(0, 3).map((member) => <Badge key={member.id} variant="secondary">{member.displayName}</Badge>)}
      <Button type="button" variant="ghost" size="sm">Clear Filters</Button>
    </div>
  );
}

