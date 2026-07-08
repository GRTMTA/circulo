import { cn } from "@/lib/utils";

interface ToggleRowProps {
  title: string;
  helper: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function ToggleRow({
  title,
  helper,
  checked,
  disabled,
  onChange,
  className,
}: ToggleRowProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-5 rounded-[var(--radius)] border border-[var(--color-border)] bg-white p-5",
        disabled && "cursor-not-allowed opacity-70",
        className
      )}
    >
      <span>
        <span className="block font-semibold text-[var(--color-text-primary)]">
          {title}
        </span>
        <span className="mt-1.5 block text-base leading-7 text-[var(--color-text-secondary)]">
          {helper}
        </span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 shrink-0 accent-[var(--color-primary)]"
      />
    </label>
  );
}
