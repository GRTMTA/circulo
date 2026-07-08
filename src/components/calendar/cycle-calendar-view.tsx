"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MockCalendarEvent } from "@/lib/mocks";

export function CycleCalendarView({
  events,
  currentMonth,
}: {
  events: MockCalendarEvent[];
  currentMonth?: Date;
}) {
  const [month, setMonth] = useState(currentMonth ?? new Date("2026-07-01T00:00:00.000Z"));
  const days = Array.from({ length: 31 }, (_, index) => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), index + 1)));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Cycle Calendar</CardTitle>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="icon-sm" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))}><ChevronLeft className="size-4" /></Button>
            <Button type="button" variant="outline" size="icon-sm" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))}><ChevronRight className="size-4" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="font-semibold">{month.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}</p>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayEvents = events.filter((event) => new Date(event.date).getUTCDate() === day.getUTCDate());
            return (
              <div key={day.toISOString()} className="min-h-24 rounded-xl border border-border bg-white p-2">
                <p className="text-sm font-semibold">{day.getUTCDate()}</p>
                <div className="mt-2 grid gap-1">
                  {dayEvents.map((event) => (
                    <Badge key={`${event.date}-${event.label}`} variant={event.type === "grace_end" ? "destructive" : event.type === "payout" ? "default" : "secondary"}>
                      {event.label}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

