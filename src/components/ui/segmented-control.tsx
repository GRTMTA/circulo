"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "grid gap-2",
        options.length === 2 ? "grid-cols-2" : "grid-cols-3",
        className
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-lg border px-5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)]/40",
              selected
                ? "border-[var(--color-primary)] bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)]"
                : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-primary-light)] hover:text-[var(--color-text-primary)]",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            {option.icon ? <option.icon className="size-4" /> : null}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
