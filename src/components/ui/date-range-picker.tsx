"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateOnly, parseDateOnly, serializeDateOnly } from "@/lib/date";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  fromValue: string;
  toValue: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
}

function useTwoMonthCalendar() {
  const [isTwoMonth, setIsTwoMonth] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 720px)");
    const handleChange = () => setIsTwoMonth(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isTwoMonth;
}

export function DateRangePicker({
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  placeholder = "Pick date range",
  ariaLabel,
  className,
  disabled = false,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const isTwoMonthCalendar = useTwoMonthCalendar();

  const selectedRange = useMemo<DateRange | undefined>(() => {
    const from = parseDateOnly(fromValue);
    const to = parseDateOnly(toValue);
    if (!from && !to) return undefined;
    return { from, to };
  }, [fromValue, toValue]);

  const [draftRange, setDraftRange] = useState<DateRange | undefined>(
    selectedRange
  );

  const displayValue = useMemo(() => {
    if (fromValue && toValue) {
      return `${formatDateOnly(fromValue)} - ${formatDateOnly(toValue)}`;
    }
    if (fromValue) {
      return `${formatDateOnly(fromValue)} - Select end`;
    }
    if (toValue) {
      return `Until ${formatDateOnly(toValue)}`;
    }

    return "";
  }, [fromValue, toValue]);

  function commitRange(range: DateRange | undefined) {
    onFromChange(range?.from ? serializeDateOnly(range.from) : "");
    onToChange(range?.to ? serializeDateOnly(range.to) : "");
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setDraftRange(selectedRange);
        }
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger
        nativeButton
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-[10px] border border-[var(--color-border)] bg-white px-4 text-left text-base font-semibold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-primary)]/55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)]/40 focus-visible:ring-offset-1",
          disabled && "pointer-events-none opacity-55",
          className
        )}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <CalendarIcon className="size-5 shrink-0 text-[var(--color-text-secondary)]" />
          {displayValue ? (
            <span className="truncate">{displayValue}</span>
          ) : (
            <span className="truncate text-[var(--color-text-muted)]">{placeholder}</span>
          )}
        </span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto max-w-[calc(100vw-1rem)] overflow-x-auto p-0"
      >
        <Calendar
          mode="range"
          defaultMonth={draftRange?.from ?? selectedRange?.from}
          numberOfMonths={isTwoMonthCalendar ? 2 : 1}
          selected={draftRange}
          onSelect={(range) => {
            setDraftRange(range);
            if (range?.from && range?.to) {
              commitRange(range);
              setOpen(false);
            }
          }}
        />
        <div className="flex items-center justify-between gap-2 border-t border-[var(--color-border)] p-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-11 px-5"
            disabled={!draftRange?.from && !draftRange?.to}
            onClick={() => {
              setDraftRange(undefined);
              onFromChange("");
              onToChange("");
              setOpen(false);
            }}
          >
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-11 px-5"
            disabled={!draftRange?.from && !draftRange?.to}
            onClick={() => {
              commitRange(draftRange);
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
