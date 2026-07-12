"use client";

import { HelpCircle } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoTipProps {
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * Small help icon that shows a tooltip on hover explaining a field or concept.
 */
export function InfoTip({ children, side = "right" }: InfoTipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          type="button"
          className="inline-flex size-4 items-center justify-center rounded-full text-[var(--color-text-alternative)] transition-colors hover:text-[var(--color-primary-default)]"
          aria-label="More info"
        >
          <HelpCircle className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[240px] text-sm font-normal leading-snug">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
