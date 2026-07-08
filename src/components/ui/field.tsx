import * as React from "react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field"
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("grid gap-5", className)}
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="field-label"
      className={cn(
        "text-base font-semibold leading-none text-[var(--color-text-primary)]",
        className
      )}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-base leading-7 text-muted-foreground", className)}
      {...props}
    />
  );
}

function FieldSeparator({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-separator"
      className={cn("relative flex items-center", className)}
      {...props}
    >
      <Separator />
      {children ? (
        <span
          data-slot="field-separator-content"
          className="absolute left-1/2 -translate-x-1/2 bg-card px-3 text-base text-muted-foreground"
        >
          {children}
        </span>
      ) : null}
    </div>
  );
}

export {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
};
