import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface EmptyStateIllustration {
  src: string;
  alt: string;
}

interface EmptyStateProps {
  illustration?: EmptyStateIllustration;
  icon?: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}

export function EmptyState({
  illustration,
  icon,
  title,
  description,
  actions,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[50vh] flex-col items-center justify-center rounded-[10px] border border-dashed border-[var(--color-border)] bg-white p-10 text-center",
        className
      )}
    >
      {illustration ? (
        <Image
          src={illustration.src}
          alt={illustration.alt}
          width={300}
          height={300}
          className="h-32 w-auto object-contain"
          draggable={false}
        />
      ) : icon ? (
        <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)]">
          {icon}
        </div>
      ) : null}
      <h2 className="mt-6 text-xl font-semibold text-[var(--color-text-primary)]">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--color-text-secondary)]">
        {description}
      </p>
      {actions ? (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
