"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BreadcrumbTrailItem {
  label: string;
  href?: string;
}

interface BreadcrumbTrailProps {
  items: BreadcrumbTrailItem[];
  className?: string;
  homeLabel?: string;
  homeHref?: string;
}

export function BreadcrumbTrail({
  items,
  className,
  homeLabel = "Dashboard",
  homeHref = "/dashboard",
}: BreadcrumbTrailProps) {
  const cleanedItems = items.filter((item) => item.label.trim().length > 0);
  const trail: BreadcrumbTrailItem[] = [
    {
      label: homeLabel,
      href: homeHref,
    },
    ...cleanedItems,
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-3 text-base font-semibold text-[var(--color-text-secondary)]", className)}
    >
      <ol className="flex min-w-0 items-center gap-2 rounded-xl py-2">
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;

          return (
            <li
              key={`${item.href ?? item.label}-${index.toString()}`}
              className="flex min-w-0 items-center gap-2"
            >
              {isLast ? (
                <span className="truncate font-bold text-[var(--color-text-primary)]" aria-current="page">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="truncate transition-colors hover:text-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)]/40"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="truncate">{item.label}</span>
              )}

              {!isLast ? <ChevronRight className="size-4" aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
