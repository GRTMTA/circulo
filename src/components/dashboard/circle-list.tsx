"use client";

import Link from "next/link";
import { Activity, CircleAlert, CircleCheck, CircleDashed, CircleDollarSign, Plus, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";

import { CircleCard } from "@/components/dashboard/circle-card";
import { CircleFilterBar, type CircleFilter, type CircleSort } from "@/components/dashboard/circle-filter-bar";
import { CircleSummaryCard } from "@/components/dashboard/circle-summary-card";
import { Button } from "@/components/ui/button";
import type { CirclesDTO, CircleListItem } from "@/lib/dashboard/types";

function isDueSoon(circle: CircleListItem) {
  if (["due_soon", "due_now", "late", "missed"].includes(circle.myPaymentStatus ?? "")) return true;
  if (!circle.nextDueAt || circle.status !== "active") return false;
  const due = new Date(circle.nextDueAt).getTime();
  return due >= Date.now() && due <= Date.now() + 7 * 24 * 60 * 60 * 1000;
}

function isAttention(circle: CircleListItem) {
  return ["due_soon", "due_now", "late", "missed", "disputed"].includes(circle.myPaymentStatus ?? "") || ["delayed", "disputed"].includes(circle.status);
}

function formatExposure(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function EmptyCircles() {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-200 bg-white px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700"><CircleDollarSign className="size-7" /></div>
      <h2 className="mt-5 text-xl font-semibold text-[var(--color-text-default)]">No circles yet</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-text-alternative)]">Start a private savings circle or accept an invite to see your shared contribution groups here.</p>
      <Button render={<Link href="/dashboard/create" />} nativeButton={false} className="mt-6"><Plus className="size-4" /> Create your first circle</Button>
    </div>
  );
}

function NoResults() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border-default)] bg-white px-6 py-14 text-center">
      <CircleDashed className="mx-auto size-8 text-slate-300" />
      <h2 className="mt-4 text-lg font-semibold text-[var(--color-text-default)]">No matching circles</h2>
      <p className="mt-2 text-sm text-[var(--color-text-alternative)]">There are no circles in this view yet. Try another status filter.</p>
    </div>
  );
}

export function CircleList({ circles, initialFilter = "all" }: { circles: CirclesDTO; initialFilter?: CircleFilter }) {
  const [filter, setFilter] = useState<CircleFilter>(initialFilter);
  const [sort, setSort] = useState<CircleSort>("recent");

  const metrics = useMemo(() => ({
    active: circles.filter((circle) => circle.status === "active").length,
    drafts: circles.filter((circle) => circle.status === "draft").length,
    dueSoon: circles.filter(isDueSoon).length,
    exposure: circles.reduce((total, circle) => total + circle.contributionAmount * circle.memberCount, 0),
  }), [circles]);

  const filteredCircles = useMemo(() => {
    return circles
      .filter((circle) => filter === "all" || circle.status === filter)
      .sort((a, b) => {
        if (sort === "members") return b.memberCount - a.memberCount;
        if (sort === "contribution") return b.contributionAmount - a.contributionAmount;
        if (sort === "due") return (a.nextDueAt ? new Date(a.nextDueAt).getTime() : Number.MAX_SAFE_INTEGER) - (b.nextDueAt ? new Date(b.nextDueAt).getTime() : Number.MAX_SAFE_INTEGER);
        return circles.indexOf(a) - circles.indexOf(b);
      });
  }, [circles, filter, sort]);

  const attention = filteredCircles.filter(isAttention);
  const regular = filteredCircles.filter((circle) => !isAttention(circle));

  return (
    <div className="mx-auto grid max-w-[1440px] gap-7 rounded-[28px] border border-white/80 bg-[#fcfdfd] px-4 py-6 shadow-[0_24px_70px_-48px_rgba(18,49,61,0.5)] sm:px-6 sm:py-7 lg:px-8 lg:py-8">
      <section className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--color-text-default)] sm:text-4xl">Your Circles</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-alternative)]">Keep every shared savings commitment visible, ready, and on schedule.</p>
        </div>
        <Button render={<Link href="/dashboard/create" />} nativeButton={false} className="w-full sm:w-auto">
          <Plus className="size-4" />
          Create Circle
        </Button>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Circle summary">
        <CircleSummaryCard label="Total circles" value={String(circles.length)} icon={WalletCards} tone="accent" />
        <CircleSummaryCard label="Active" value={String(metrics.active)} detail="Currently running" icon={Activity} />
        <CircleSummaryCard label="Drafts" value={String(metrics.drafts)} detail="Not activated" icon={CircleDashed} />
        <CircleSummaryCard label="Due soon" value={String(metrics.dueSoon)} detail="Needs a closer look" icon={CircleAlert} tone={metrics.dueSoon > 0 ? "warning" : "default"} />
        <CircleSummaryCard label="Total exposure" value={`${formatExposure(metrics.exposure)} USDC`} detail="Across listed circles" icon={CircleCheck} tone="accent" />
      </section>

      <CircleFilterBar filter={filter} sort={sort} onFilterChange={setFilter} onSortChange={setSort} />

      {circles.length === 0 ? <EmptyCircles /> : filteredCircles.length === 0 ? <NoResults /> : (
        <section className="grid gap-6" data-onboarding="circle-cards">
          {attention.length > 0 ? (
            <div className="grid gap-3">
              <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-amber-500" /><h2 className="text-lg font-semibold text-[var(--color-text-default)]">Needs attention</h2><span className="text-sm text-[var(--color-text-alternative)]">{attention.length}</span></div>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{attention.map((circle) => <CircleCard key={circle.id} circle={circle} />)}</div>
            </div>
          ) : null}
          {regular.length > 0 ? (
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-[var(--color-text-default)]">All circles</h2><span className="text-sm text-[var(--color-text-alternative)]">{regular.length} shown</span></div>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{regular.map((circle) => <CircleCard key={circle.id} circle={circle} />)}</div>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
