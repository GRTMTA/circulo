"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface OptionComboboxOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  prefixSwatch?: string;
  secondaryText?: string;
  searchText?: string;
}

interface OptionComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: OptionComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

export function OptionCombobox({
  value,
  onChange,
  options,
  placeholder = "Choose an option",
  searchPlaceholder = "Search options",
  disabled = false,
  searchable = false,
  className,
}: OptionComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) {
      return options;
    }

    const normalized = query.trim().toLowerCase();
    return options.filter((option) =>
      `${option.label} ${option.value} ${option.secondaryText ?? ""} ${option.searchText ?? ""}`
        .toLowerCase()
        .includes(normalized)
    );
  }, [options, query, searchable]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQuery("");
        }
      }}
    >
      <PopoverTrigger
        nativeButton
        disabled={disabled}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-4 text-left text-base text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-primary-light)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-light)]/40 disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
      >
        {selected ? (
          <span className="inline-flex min-w-0 items-center gap-2.5">
            {selected.icon ? <selected.icon className="size-4 text-[var(--color-primary-dark)]" /> : null}
            {selected.prefixSwatch ? (
              <span
                className="size-3.5 shrink-0 rounded-full border border-black/10"
                style={{ backgroundColor: selected.prefixSwatch }}
              />
            ) : null}
            <span className="truncate font-medium">{selected.label}</span>
            {selected.secondaryText ? (
              <span className="truncate text-[var(--color-text-secondary)]">
                {selected.secondaryText}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="text-[var(--color-text-muted)]">{placeholder}</span>
        )}
        <ChevronDown className="size-4 text-[var(--color-text-muted)]" />
      </PopoverTrigger>
      <PopoverContent className="p-2">
        {searchable ? (
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-12 pl-11"
              autoFocus
            />
          </div>
        ) : null}
        <div className={cn("overflow-y-auto", searchable ? "mt-2 max-h-72" : "max-h-80")}>
          {filteredOptions.length === 0 ? (
            <p className="px-4 py-4 text-base text-[var(--color-text-secondary)]">
              No matching options.
            </p>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex min-h-12 w-full items-center justify-between rounded-[var(--radius)] px-4 py-3 text-left text-base transition-colors hover:bg-[var(--color-primary-lighter)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-light)]/35",
                    isSelected && "bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)]"
                  )}
                >
                  <span className="inline-flex min-w-0 items-center gap-2.5">
                    {option.icon ? <option.icon className="size-4 shrink-0 text-[var(--color-primary-dark)]" /> : null}
                    {option.prefixSwatch ? (
                      <span
                        className="size-3.5 shrink-0 rounded-full border border-black/10"
                        style={{ backgroundColor: option.prefixSwatch }}
                      />
                    ) : null}
                    <span className="truncate font-medium text-[var(--color-text-primary)]">
                      {option.label}
                    </span>
                    {option.secondaryText ? (
                      <span className="truncate text-[var(--color-text-secondary)]">
                        {option.secondaryText}
                      </span>
                    ) : null}
                  </span>
                  {isSelected ? <Check className="size-4 text-[var(--color-primary-dark)]" /> : null}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
