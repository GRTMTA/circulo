"use client";

import { SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

export type CircleFilter = "all" | "active" | "draft" | "completed" | "cancelled";
export type CircleSort = "recent" | "due" | "members" | "contribution";

interface CircleFilterBarProps {
  filter: CircleFilter;
  sort: CircleSort;
  onFilterChange: (filter: CircleFilter) => void;
  onSortChange: (sort: CircleSort) => void;
}

const filters: { value: CircleFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Drafts" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function CircleFilterBar({
  filter,
  sort,
  onFilterChange,
  onSortChange,
}: CircleFilterBarProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-2.5 sm:p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-1 overflow-x-auto" role="tablist" aria-label="Circle status filter">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={filter === item.value}
              onClick={() => onFilterChange(item.value)}
              className={cn(
                "shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100",
                filter === item.value
                  ? "bg-white text-[var(--color-text-default)] shadow-sm ring-1 ring-slate-200/80"
                  : "text-[var(--color-text-alternative)] hover:bg-white/70 hover:text-[var(--color-text-default)]"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 text-sm text-[var(--color-text-alternative)] shadow-sm">
              <SlidersHorizontal className="size-3.5" />
              <span>Sort by</span>
              <select
                value={sort}
                onChange={(event) => onSortChange(event.target.value as CircleSort)}
                className="min-w-0 bg-transparent text-sm font-medium text-[var(--color-text-default)] outline-none"
                aria-label="Sort circles"
              >
                <option value="recent">Most recent</option>
                <option value="due">Next due</option>
                <option value="members">Most members</option>
                <option value="contribution">Highest contribution</option>
              </select>
            </label>
      </div>
    </div>
  );
}
