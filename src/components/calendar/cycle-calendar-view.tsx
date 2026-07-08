"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Filter,
  Send,
  ShieldAlert,
  UserPlus,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { DashboardContribution, DashboardMember, DashboardPayout, DashboardRound } from "@/lib/dashboard/types";
import { createCalendarEvents, createDayEvents, type CalendarEvent, type CalendarEventType } from "@/lib/mocks";
import { cn } from "@/lib/utils";

type CalendarView = "month" | "week" | "agenda";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_ICONS: Record<CalendarEventType, typeof CircleDollarSign> = {
  contribution_due: CircleDollarSign,
  contribution_paid: CheckCircle,
  contribution_late: AlertTriangle,
  contribution_missed: X,
  payout: Send,
  payout_ready: CheckCircle,
  payout_paid: CheckCircle,
  grace_start: Clock,
  grace_end: ShieldAlert,
  collateral_posted: ShieldAlert,
  collateral_slashed: ShieldAlert,
  member_joined: UserPlus,
  agreement_accepted: CheckCircle,
  round_start: Calendar,
  round_end: CheckCircle,
  reminder_sent: Send,
};

function getEventDotColor(type: CalendarEventType, status?: string): string {
  if (type === "contribution_paid" || type === "payout_paid" || type === "payout_ready") return "bg-green-500";
  if (type === "contribution_late" || type === "contribution_missed" || type === "grace_end" || type === "collateral_slashed") return "bg-red-500";
  if (type === "grace_start" || status === "warning") return "bg-amber-500";
  if (type === "payout" || type === "contribution_due" || type === "round_start") return "bg-blue-500";
  return "bg-gray-400";
}

function EventIcon({ type }: { type: CalendarEventType }) {
  const Icon = EVENT_ICONS[type] ?? CircleDollarSign;
  const color =
    type.includes("paid") || type.includes("ready") ? "text-green-600" :
    type.includes("late") || type.includes("missed") || type.includes("grace") || type.includes("slashed") ? "text-red-600" :
    type.includes("payout") ? "text-blue-600" :
    "text-gray-500";
  return <Icon className={cn("size-4 shrink-0", color)} />;
}

function MonthGrid({
  month,
  events,
  currentMemberId,
}: {
  month: Date;
  events: CalendarEvent[];
  members: DashboardMember[];
  currentMemberId?: string;
}) {
  const today = new Date();
  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const firstDay = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthIdx, 0).getDate();

  const cells: (number | null)[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push(daysInPrevMonth - i);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  function isToday(day: number) {
    return (
      today.getFullYear() === year &&
      today.getMonth() === monthIdx &&
      today.getDate() === day
    );
  }

  return (
    <div className="grid grid-cols-7 gap-px rounded-xl border border-border bg-muted">
      {WEEKDAYS.map((day) => (
        <div key={day} className="bg-[var(--color-background-default)] p-2 text-center text-xs font-semibold text-muted-foreground">
          {day}
        </div>
      ))}
      {cells.map((day, i) => {
        if (day === null) {
          return <div key={`empty-${i}`} className="min-h-24 bg-[var(--color-background-default)] p-1 opacity-30" />;
        }

        const date = new Date(year, monthIdx, day);
        const dayEvents = createDayEvents(date, events);
        const todayHighlight = isToday(day);
        const displayDots = dayEvents.slice(0, 3);
        const overflow = dayEvents.length > 3 ? dayEvents.length - 3 : 0;

        return (
          <Popover key={day}>
            <PopoverTrigger
              nativeButton
              className="block min-h-24 w-full cursor-pointer bg-[var(--color-background-default)] p-1 text-left transition-colors hover:bg-[var(--color-background-muted)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--color-primary-muted)]"
            >
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                  todayHighlight && "bg-[var(--color-primary-default)] text-[var(--color-primary-inverse)]",
                )}
              >
                {day}
              </span>
              <div className="mt-1 space-y-1">
                {displayDots.map((event) => (
                  <div key={event.id} className="flex items-center gap-1.5">
                    <span className={cn("size-1.5 shrink-0 rounded-full", getEventDotColor(event.type, event.status))} />
                    <span className="truncate text-[11px] leading-tight text-muted-foreground">
                      {event.memberName ?? event.title}
                    </span>
                  </div>
                ))}
                {overflow > 0 ? (
                  <p className="text-[11px] leading-tight text-muted-foreground">+{overflow} more</p>
                ) : null}
              </div>
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={4} className="w-72 p-0">
              <DayPopoverContent date={date} events={dayEvents} currentMemberId={currentMemberId} />
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}

function DayPopoverContent({
  date,
  events,
  currentMemberId,
}: {
  date: Date;
  events: CalendarEvent[];
  currentMemberId?: string;
}) {
  if (events.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No events for {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-border px-4 py-3">
        <p className="font-semibold">
          {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {events.map((event) => {
          const isOwn = event.isCurrentUser || event.memberId === currentMemberId;
          return (
            <div
              key={event.id}
              className={cn(
                "flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0",
                isOwn && "bg-[var(--color-primary-muted)]/30",
              )}
            >
              {event.memberAvatarUrl ? (
                <Avatar className="size-8 shrink-0">
                  <AvatarImage src={event.memberAvatarUrl} alt={event.memberName ?? ""} />
                  <AvatarFallback>{(event.memberName ?? "?")[0]}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <EventIcon type={event.type} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{event.title}</p>
                  {event.status ? (
                    <Badge variant={event.status === "overdue" || event.status === "warning" ? "destructive" : "secondary"} className="shrink-0 text-[10px]">
                      {event.status}
                    </Badge>
                  ) : null}
                </div>
                {event.description ? (
                  <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>
                ) : null}
                {event.amount ? (
                  <p className="mt-1 text-xs font-medium">{event.amount} {event.asset ?? "USDC"}</p>
                ) : null}
                {event.actionLabel ? (
                  <Button size="xs" className="mt-2 h-7 text-xs" variant={event.actionType === "pay" ? "default" : "outline"}>
                    {event.actionLabel}
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  month,
  events,
  currentMemberId,
}: {
  month: Date;
  events: CalendarEvent[];
  members: DashboardMember[];
  currentMemberId?: string;
}) {
  const startOfWeek = new Date(month);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const today = new Date();

  return (
    <div className="grid grid-cols-7 gap-px rounded-xl border border-border bg-muted">
      {WEEKDAYS.map((day) => (
        <div key={day} className="bg-[var(--color-background-default)] p-2 text-center text-xs font-semibold text-muted-foreground">
          {day}
        </div>
      ))}
      {days.map((day) => {
        const dayEvents = createDayEvents(day, events);
        const isToday =
          day.getDate() === today.getDate() &&
          day.getMonth() === today.getMonth() &&
          day.getFullYear() === today.getFullYear();

        return (
          <Popover key={day.toISOString()}>
            <PopoverTrigger
              nativeButton
              className="block min-h-32 w-full cursor-pointer bg-[var(--color-background-default)] p-2 text-left transition-colors hover:bg-[var(--color-background-muted)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--color-primary-muted)]"
            >
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                  isToday && "bg-[var(--color-primary-default)] text-[var(--color-primary-inverse)]",
                )}
              >
                {day.getDate()}
              </span>
              <div className="mt-2 space-y-1.5">
                {dayEvents.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "flex items-center gap-1.5 truncate rounded-md px-1.5 py-0.5 text-[11px]",
                      event.type.includes("paid") && "bg-green-50 text-green-800",
                      event.type.includes("late") || event.type.includes("missed") ? "bg-red-50 text-red-800" :
                      "bg-blue-50 text-blue-800",
                    )}
                  >
                    <EventIcon type={event.type} />
                    <span className="truncate">{event.memberName ?? event.title}</span>
                  </div>
                ))}
                {dayEvents.length > 5 ? (
                  <p className="text-[11px] text-muted-foreground">+{dayEvents.length - 5} more</p>
                ) : null}
              </div>
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={4} className="w-72 p-0">
              <DayPopoverContent date={day} events={dayEvents} currentMemberId={currentMemberId} />
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}

function AgendaView({
  events,
  currentMemberId,
}: {
  events: CalendarEvent[];
  members: DashboardMember[];
  currentMemberId?: string;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const key = new Date(event.date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    });
    return map;
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No events in this view. Adjust filters or create a circle to get started.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([dateLabel, dayEvents]) => (
        <div key={dateLabel}>
          <p className="mb-3 text-sm font-semibold text-muted-foreground">{dateLabel}</p>
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border border-border bg-white p-3",
                  event.isCurrentUser || event.memberId === currentMemberId ? "ring-2 ring-[var(--color-primary-muted)]" : "",
                )}
              >
                {event.memberAvatarUrl ? (
                  <Avatar className="size-8 shrink-0">
                    <AvatarImage src={event.memberAvatarUrl} alt={event.memberName ?? ""} />
                    <AvatarFallback>{(event.memberName ?? "?")[0]}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <EventIcon type={event.type} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{event.title}</p>
                    {event.status ? (
                      <Badge variant={event.status === "overdue" ? "destructive" : "secondary"} className="shrink-0 text-[10px]">
                        {event.status}
                      </Badge>
                    ) : null}
                  </div>
                  {event.description ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{event.description}</p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(event.date).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  {event.actionLabel ? (
                    <Button size="xs" className="mt-2 h-7 text-xs" variant={event.actionType === "pay" ? "default" : "outline"}>
                      {event.actionLabel}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoundProgressBar({
  currentRound,
  paidCount,
  totalMembers,
  collectedAmount,
  expectedAmount,
  asset,
}: {
  currentRound: number;
  paidCount: number;
  totalMembers: number;
  collectedAmount: number;
  expectedAmount: number;
  asset: string;
}) {
  const pct = totalMembers > 0 ? Math.round((paidCount / totalMembers) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Round {currentRound} progress</p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {collectedAmount} / {expectedAmount} {asset}
        </p>
      </div>
      <Progress value={pct} className="mt-2">
        <span className="text-xs text-muted-foreground">{paidCount} of {totalMembers} paid</span>
      </Progress>
    </div>
  );
}

interface CycleCalendarViewProps {
  rounds: DashboardRound[];
  payouts: DashboardPayout[];
  contributions: DashboardContribution[];
  members: DashboardMember[];
  currentMemberId?: string;
  defaultView?: CalendarView;
  onPayNow?: (memberId: string) => void;
  onSendReminder?: (memberId: string) => void;
}

export function CycleCalendarView({
  rounds,
  payouts,
  contributions,
  members,
  currentMemberId,
  defaultView = "month",
}: CycleCalendarViewProps) {
  const now = new Date();
  const [month, setMonth] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const [view, setView] = useState<CalendarView>(defaultView);

  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterMember, setFilterMember] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const allEvents = useMemo(
    () => createCalendarEvents(rounds, payouts, contributions, members, currentMemberId),
    [rounds, payouts, contributions, members, currentMemberId],
  );

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      if (filterType && event.type !== filterType) return false;
      if (filterMember && event.memberId !== filterMember) return false;
      return true;
    });
  }, [allEvents, filterType, filterMember]);

  const activeRound = rounds.find((r) => ["active", "late", "grace_period"].includes(r.status));
  const paidInCurrent = contributions.filter((c) => c.status === "paid").length;

  const uniqueTypes = useMemo(() => {
    const types = new Set(allEvents.map((e) => e.type));
    return Array.from(types);
  }, [allEvents]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Cycle Calendar</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              value={view}
              onChange={(v) => setView(v as CalendarView)}
              options={[
                { value: "month" as const, label: "Month" },
                { value: "week" as const, label: "Week" },
                { value: "agenda" as const, label: "Agenda" },
              ]}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon-sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <p className="min-w-36 text-center font-semibold">
              {month.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
            </p>
            <Button type="button" variant="outline" size="icon-sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMonth(new Date(now.getFullYear(), now.getMonth(), 1))}
            >
              Today
            </Button>
            <Button
              type="button"
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="size-3.5" />
              Filters
            </Button>
            {(filterType || filterMember) ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => { setFilterType(null); setFilterMember(null); }}>
                <X className="size-3.5" />
                Clear
              </Button>
            ) : null}
          </div>
        </div>

        {showFilters ? (
          <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-white p-3">
            <select
              className="rounded-lg border border-border bg-[var(--color-background-default)] px-3 py-1.5 text-sm"
              value={filterType ?? ""}
              onChange={(e) => setFilterType(e.target.value || null)}
            >
              <option value="">All event types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
            <select
              className="rounded-lg border border-border bg-[var(--color-background-default)] px-3 py-1.5 text-sm"
              value={filterMember ?? ""}
              onChange={(e) => setFilterMember(e.target.value || null)}
            >
              <option value="">All members</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.displayName}</option>
              ))}
            </select>
          </div>
        ) : null}

        {view === "month" ? (
          <MonthGrid
            month={month}
            events={filteredEvents}
            members={members}
            currentMemberId={currentMemberId}
          />
        ) : view === "week" ? (
          <WeekView
            month={month}
            events={filteredEvents}
            members={members}
            currentMemberId={currentMemberId}
          />
        ) : (
          <AgendaView events={filteredEvents} members={members} currentMemberId={currentMemberId} />
        )}

        {activeRound ? (
          <RoundProgressBar
            currentRound={activeRound.roundNumber}
            paidCount={paidInCurrent}
            totalMembers={members.length}
            collectedAmount={activeRound.collectedAmount}
            expectedAmount={activeRound.expectedAmount}
            asset="USDC"
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
