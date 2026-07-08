"use client";

import { useMemo, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateOnly, parseDateOnly, serializeDateOnly } from "@/lib/date";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  ariaLabel,
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => parseDateOnly(value), [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        nativeButton
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-[10px] border-2 border-[var(--color-border)] bg-white px-5 text-left text-base font-semibold text-[var(--color-text-primary)] transition-colors shadow-sm hover:border-[var(--color-primary)]/55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)]/50",
          disabled && "pointer-events-none opacity-55",
          className
        )}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        <span className="inline-flex min-w-0 items-center gap-5">
          <CalendarIcon className="size-5 text-[var(--color-text-secondary)]" />
          {selectedDate ? (
            <span className="truncate">{formatDateOnly(value, "PPP")}</span>
          ) : (
            <span className="truncate text-[var(--color-text-muted)]">{placeholder}</span>
          )}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            onChange(serializeDateOnly(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
