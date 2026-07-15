import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface CircleSummaryCardProps {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone?: "default" | "accent" | "warning";
}

export function CircleSummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: CircleSummaryCardProps) {
  return (
    <div className="group rounded-xl border border-slate-100 bg-white p-4 shadow-[0_10px_28px_-26px_rgba(18,49,61,0.35)] transition-shadow hover:shadow-[0_14px_32px_-24px_rgba(18,49,61,0.22)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-text-alternative)]">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-semibold text-[var(--color-text-default)] tabular-nums">
            {value}
          </p>
          {detail ? (
            <p className="mt-1 truncate text-xs text-[var(--color-text-alternative)]">
              {detail}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl border",
            tone === "accent" && "border-cyan-100 bg-cyan-50 text-cyan-700",
            tone === "warning" && "border-amber-100 bg-amber-50 text-amber-700",
            tone === "default" && "border-slate-100 bg-slate-50 text-slate-500"
          )}
        >
          <Icon className="size-4" strokeWidth={2.2} />
        </span>
      </div>
    </div>
  );
}
