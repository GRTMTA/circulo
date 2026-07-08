import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-[10px] border border-input bg-white px-4 py-3 text-base text-foreground transition-colors outline-none file:inline-flex file:h-12 file:border-0 file:bg-transparent file:text-base file:font-medium file:text-foreground placeholder:text-[var(--color-text-muted)] focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
