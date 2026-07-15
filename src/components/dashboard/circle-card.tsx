import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CircleDollarSign,
  LockKeyhole,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CircleListItem } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

function titleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (["cancelled", "disputed", "late", "missed"].includes(status)) return "destructive";
  if (["active", "completed", "paid"].includes(status)) return "default";
  if (["draft", "pending", "scheduled", "due_soon", "due_now"].includes(status)) return "secondary";
  return "outline";
}

function paymentLabel(status: string | undefined) {
  if (!status) return "No payment due";
  if (status === "due_soon") return "Due soon";
  if (status === "due_now") return "Due now";
  return titleCase(status);
}

function isActionRequired(circle: CircleListItem) {
  return circle.role === "member" && ["due_soon", "due_now", "late", "missed"].includes(circle.myPaymentStatus ?? "");
}

const avatarPalette = [
  "bg-cyan-100 text-cyan-800",
  "bg-sky-100 text-sky-800",
  "bg-teal-100 text-teal-800",
  "bg-indigo-100 text-indigo-800",
];

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function MemberAvatars({ circle }: { circle: CircleListItem }) {
  const visibleCount = Math.min(circle.memberCount, 4);
  const initials = Array.from({ length: visibleCount }, (_, index) =>
    getInitials(index === 0 ? circle.name : `${circle.name} ${index + 1}`)
  );
  const remaining = Math.max(0, circle.memberCount - visibleCount);

  return (
    <div className="flex items-center" aria-label={`${circle.memberCount} members`}>
      <div className="flex -space-x-2">
        {initials.map((initial, index) => (
          <span
            key={`${initial}-${index}`}
            className={cn(
              "flex size-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold",
              avatarPalette[index % avatarPalette.length]
            )}
          >
            {initial}
          </span>
        ))}
        {remaining > 0 ? (
          <span className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-semibold text-slate-600">
            +{remaining}
          </span>
        ) : null}
      </div>
      <span className="ml-3 text-xs text-[var(--color-text-alternative)]">{circle.memberCount} members</span>
    </div>
  );
}

export function CircleCard({ circle, list = false }: { circle: CircleListItem; list?: boolean }) {
  const progress = circle.totalRounds > 0 ? Math.min(100, Math.max(0, (circle.currentRound / circle.totalRounds) * 100)) : 0;
  const actionRequired = isActionRequired(circle);

  return (
    <article
      className={cn(
        "group rounded-xl border border-slate-100 bg-white shadow-[0_8px_22px_-22px_rgba(18,49,61,0.28)] transition-all duration-200 hover:border-cyan-200 hover:shadow-[0_12px_26px_-22px_rgba(18,49,61,0.2)]",
        list ? "p-4 sm:p-5" : "p-5"
      )}
    >
      <div className={cn(list ? "grid gap-5 lg:grid-cols-[minmax(15rem,1fr)_minmax(24rem,1.5fr)_auto] lg:items-center" : "grid gap-5")}>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <LockKeyhole className="size-4" />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-[var(--color-text-default)]">{circle.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant={statusVariant(circle.status)} className="min-h-6 px-2.5 py-0.5 text-xs">{titleCase(circle.status)}</Badge>
                  <Badge variant="outline" className="min-h-6 px-2.5 py-0.5 text-xs">{titleCase(circle.role)}</Badge>
                </div>
              </div>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-slate-300 transition-colors group-hover:text-cyan-600" />
          </div>
          {!list ? (
            <div className="mt-5">
              <p className="text-xs font-medium text-[var(--color-text-alternative)]">Contribution</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-text-default)] tabular-nums">{circle.contributionAmount} <span className="text-sm font-medium text-[var(--color-text-alternative)]">{circle.contributionAsset}</span></p>
            </div>
          ) : null}
        </div>

        <div className={cn("grid gap-4", list ? "sm:grid-cols-4" : "grid-cols-2")}>
          {list ? (
            <div>
              <p className="text-xs font-medium text-[var(--color-text-alternative)]">Contribution</p>
              <p className="mt-1 font-semibold tabular-nums text-[var(--color-text-default)]">{circle.contributionAmount} {circle.contributionAsset}</p>
            </div>
          ) : null}
          <div className="flex items-start gap-2">
            <UsersRound className="mt-0.5 size-4 text-slate-400" />
            <div><p className="text-xs text-[var(--color-text-alternative)]">Members</p><p className="mt-1 font-semibold tabular-nums text-[var(--color-text-default)]">{circle.memberCount}</p></div>
          </div>
          {!list ? <div className="col-span-2 border-t border-slate-100 pt-3"><MemberAvatars circle={circle} /></div> : null}
          <div className="flex items-start gap-2">
            <CircleDollarSign className="mt-0.5 size-4 text-slate-400" />
            <div><p className="text-xs text-[var(--color-text-alternative)]">Round</p><p className="mt-1 font-semibold tabular-nums text-[var(--color-text-default)]">{circle.currentRound} <span className="font-normal text-slate-400">/ {circle.totalRounds}</span></p></div>
          </div>
          <div className="flex items-start gap-2">
            <CalendarClock className="mt-0.5 size-4 text-slate-400" />
            <div><p className="text-xs text-[var(--color-text-alternative)]">Next due</p><p className="mt-1 font-semibold text-[var(--color-text-default)]">{formatDate(circle.nextDueAt)}</p></div>
          </div>
          {!list ? (
            <div className="flex items-start gap-2">
              <LockKeyhole className="mt-0.5 size-4 text-slate-400" />
              <div><p className="text-xs text-[var(--color-text-alternative)]">Readiness</p><p className={cn("mt-1 font-semibold", actionRequired ? "text-amber-700" : "text-[var(--color-text-default)]")}>{paymentLabel(circle.myPaymentStatus)}</p></div>
            </div>
          ) : null}
        </div>

        <div className={cn(list ? "lg:min-w-52" : "border-t border-[var(--color-border-muted)] pt-4")}>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-[var(--color-text-alternative)]">Cycle progress</span>
            <span className="font-semibold text-[var(--color-text-default)] tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${circle.name} cycle progress`} aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <span className={cn("text-xs font-semibold", actionRequired ? "text-amber-700" : "text-[var(--color-text-alternative)]")}>
              {actionRequired ? paymentLabel(circle.myPaymentStatus) : circle.myPayoutRound ? `Payout round ${circle.myPayoutRound}` : "Rules in view"}
            </span>
            <div className="flex gap-2">
              {actionRequired ? <Button render={<Link href={`/dashboard/${circle.id}`} />} nativeButton={false} size="xs" className="h-9 bg-amber-500 px-3 text-xs text-white hover:bg-amber-600">Contribute now</Button> : null}
              <Button render={<Link href={`/dashboard/${circle.id}`} />} nativeButton={false} variant={actionRequired ? "outline" : "default"} size="xs" className="h-9 px-3 text-xs">Open circle</Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
