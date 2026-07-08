"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { cn } from "@/lib/utils";

function TooltipProvider({
  delay = 120,
  closeDelay = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      delay={delay}
      closeDelay={closeDelay}
      {...props}
    />
  );
}

function Tooltip({
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root {...props}>{children}</TooltipPrimitive.Root>;
}

function TooltipTrigger(
  props: React.ComponentProps<typeof TooltipPrimitive.Trigger>
) {
  return <TooltipPrimitive.Trigger {...props} />;
}

type TooltipContentProps = React.ComponentProps<typeof TooltipPrimitive.Popup> & {
  side?: React.ComponentProps<typeof TooltipPrimitive.Positioner>["side"];
  align?: React.ComponentProps<typeof TooltipPrimitive.Positioner>["align"];
  sideOffset?: number;
};

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  (
    {
      className,
      side = "right",
      align = "center",
      sideOffset = 10,
      ...props
    },
    ref
  ) => {
    return (
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner
          className="z-[80]"
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <TooltipPrimitive.Popup
            ref={ref}
            className={cn(
              "z-[80] rounded-[10px] bg-[var(--color-primary-dark)] px-3 py-2 text-base font-semibold text-[#edf7fa] shadow-[0_14px_30px_-18px_rgba(12,61,71,0.75)] outline-none transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              className
            )}
            {...props}
          />
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    );
  }
);

TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
