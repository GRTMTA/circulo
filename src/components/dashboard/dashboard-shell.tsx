import type { ReactNode } from "react";

import type { BreadcrumbTrailItem } from "@/components/dashboard/breadcrumb-trail";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  title?: ReactNode;
  description?: ReactNode;
  headerActions?: ReactNode;
  headerTopRow?: ReactNode;
  headerContent?: ReactNode;
  breadcrumbItems?: BreadcrumbTrailItem[];
  children: ReactNode;
  className?: string;
}

export function DashboardShell({
  title,
  description,
  headerActions,
  headerTopRow,
  headerContent,
  children,
  className,
}: DashboardShellProps) {
  const hasDefaultHeader = Boolean(title) || Boolean(description) || Boolean(headerActions);
  const hasAnyHeader =
    Boolean(headerTopRow) || Boolean(headerContent) || hasDefaultHeader;

  return (
    <div className="grid gap-5">
      <div className={cn("space-y-6", !hasAnyHeader && "space-y-0")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {headerTopRow ? (
            <div className="flex shrink-0 items-center gap-3 ml-auto">
              {headerTopRow}
            </div>
          ) : null}
        </div>

        {headerContent ? (
          <div>{headerContent}</div>
        ) : hasDefaultHeader ? (
          <div className="rounded-[16px] border border-[var(--color-border)] bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              {title ? (
                <h1 className="font-sans text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-[2rem]">
                  {title}
                </h1>
              ) : null}
              {description ? (
                <div className="max-w-[68ch] text-base leading-relaxed text-[var(--color-text-secondary)]">
                  {description}
                </div>
              ) : null}
            </div>

            {headerActions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-3 lg:justify-end">
                {headerActions}
              </div>
            ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className={cn("grid gap-6", className)}>{children}</div>
    </div>
  );
}
