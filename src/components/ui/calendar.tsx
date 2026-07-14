"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";

import { cn } from "@/lib/utils";

function Calendar({ className, classNames, ...props }: DayPickerProps) {
  return (
    <DayPicker
      showOutsideDays
      className={cn("relative p-4", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row",
        month: "space-y-3",
        month_caption: "relative flex h-11 items-center justify-center pointer-events-none",
        caption_label: "text-base font-semibold text-[var(--color-text-primary)]",
        nav: "pointer-events-none absolute inset-x-4 top-4 z-10 flex items-center justify-between",
        button_previous:
          "pointer-events-auto inline-flex size-11 items-center justify-center rounded-md border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-primary-lighter)] hover:text-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)]/40",
        button_next:
          "pointer-events-auto inline-flex size-11 items-center justify-center rounded-md border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-primary-lighter)] hover:text-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)]/40",
        chevron: "size-5",
        month_grid: "w-[19.25rem] border-collapse",
        weekdays: "flex",
        weekday:
          "w-11 text-center text-base font-semibold text-[var(--color-text-secondary)]",
        week: "mt-1.5 flex w-full",
        day: "relative size-11 p-0 text-center text-base",
        day_button:
          "relative z-10 inline-flex size-11 items-center justify-center rounded-md text-base font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-primary-lighter)] hover:text-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)]/40",
        today:
          "font-semibold text-[var(--color-primary-dark)] [&_button]:border [&_button]:border-[var(--color-primary)]",
        selected:
          "[&_button]:bg-[var(--color-primary)] [&_button]:font-semibold [&_button]:text-white [&_button]:hover:bg-[var(--color-primary-dark)] [&_button]:hover:text-white",
        range_start:
          "rounded-l-md bg-gradient-to-r from-transparent from-50% to-[var(--color-primary-lighter)] to-50% [&_button]:bg-[var(--color-primary)] [&_button]:text-white",
        range_middle:
          "bg-[var(--color-primary-lighter)] [&_button]:bg-transparent [&_button]:font-medium [&_button]:text-[var(--color-primary-text)] [&_button]:hover:bg-[var(--color-primary-light)]/45",
        range_end:
          "rounded-r-md bg-gradient-to-r from-[var(--color-primary-lighter)] from-50% to-transparent to-50% [&_button]:bg-[var(--color-primary)] [&_button]:text-white",
        outside: "text-muted-foreground opacity-70",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-5", iconClassName)} />
          ) : (
            <ChevronRight className={cn("size-5", iconClassName)} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
