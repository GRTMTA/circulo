"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Placement = "bottom" | "top" | "left" | "right";

interface SpotlightTooltipProps {
  targetRect: DOMRect | null;
  step: number;
  total: number;
  title: string;
  description: string;
  onNext: () => void;
  onSkip: () => void;
  placement?: Placement;
}

const GAP = 20;

function getBestPosition(
  targetRect: DOMRect,
  tw: number,
  th: number,
  preferred: Placement
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const candidates: { placement: Placement; top: number; left: number }[] = [
    {
      placement: "bottom",
      top: targetRect.bottom + GAP,
      left: Math.min(Math.max(targetRect.left + targetRect.width / 2 - tw / 2, 12), vw - tw - 12),
    },
    {
      placement: "top",
      top: targetRect.top - th - GAP,
      left: Math.min(Math.max(targetRect.left + targetRect.width / 2 - tw / 2, 12), vw - tw - 12),
    },
    {
      placement: "right",
      top: Math.min(Math.max(targetRect.top + targetRect.height / 2 - th / 2, 12), vh - th - 12),
      left: targetRect.right + GAP,
    },
    {
      placement: "left",
      top: Math.min(Math.max(targetRect.top + targetRect.height / 2 - th / 2, 12), vh - th - 12),
      left: targetRect.left - tw - GAP,
    },
  ];

  // Prioritize preferred
  candidates.sort((a, b) => {
    if (a.placement === preferred) return -1;
    if (b.placement === preferred) return 1;
    return 0;
  });

  for (const c of candidates) {
    const fitsX = c.left >= 8 && c.left + tw <= vw - 8;
    const fitsY = c.top >= 8 && c.top + th <= vh - 8;
    if (fitsX && fitsY) return { top: c.top, left: c.left };
  }

  // Fallback: clamp
  const fb = candidates[0];
  return {
    top: Math.max(12, Math.min(fb.top, vh - th - 12)),
    left: Math.max(12, Math.min(fb.left, vw - tw - 12)),
  };
}

export function SpotlightTooltip({
  targetRect,
  step,
  total,
  title,
  description,
  onNext,
  onSkip,
  placement = "bottom",
}: SpotlightTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    setPos(null);
  }, [step]);

  useEffect(() => {
    if (!targetRect || !ref.current) return;

    // Measure quickly so the tooltip appears fast
    const timer = setTimeout(() => {
      if (!ref.current || !targetRect) return;
      const tw = ref.current.offsetWidth;
      const th = ref.current.offsetHeight;
      const computed = getBestPosition(targetRect, tw, th, placement);
      setPos(computed);
      requestAnimationFrame(() => setVisible(true));
    }, 10);

    return () => clearTimeout(timer);
  }, [targetRect, placement, step]);

  const isLastStep = step === total;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Onboarding step ${step} of ${total}`}
      className={cn(
        "fixed z-[9999] w-[280px] rounded-2xl border border-[var(--color-border-muted)] bg-white p-5 shadow-2xl",
        "transition-[opacity,transform] duration-200 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      )}
      style={
        pos
          ? { top: pos.top, left: pos.left }
          : { top: -9999, left: -9999 }
      }
    >
      <button
        type="button"
        onClick={onSkip}
        className="absolute top-3 right-3 rounded-lg p-1 text-[var(--color-text-alternative)] transition-colors hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text-default)]"
        aria-label="Skip tour"
      >
        <X className="size-4" />
      </button>

      <div className="space-y-2 pr-6">
        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--color-primary-default)]">
          {step} / {total}
        </p>
        <h3 className="text-sm font-bold text-[var(--color-text-default)]">{title}</h3>
        <p className="text-[0.8rem] leading-relaxed text-[var(--color-text-alternative)]">
          {description}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={cn(
                "block size-1.5 rounded-full transition-colors duration-300",
                i < step
                  ? "bg-[var(--color-primary-default)]"
                  : "bg-[var(--color-border-default)]"
              )}
            />
          ))}
        </div>
        <Button size="xs" onClick={onNext}>
          {isLastStep ? "Done" : "Next"}
        </Button>
      </div>
    </div>
  );
}
