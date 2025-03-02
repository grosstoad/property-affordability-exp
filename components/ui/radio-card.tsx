"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioCardProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean
  value: string
  children: React.ReactNode
}

export const RadioCard = React.forwardRef<HTMLDivElement, RadioCardProps>(
  ({ className, checked, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 text-center text-sm transition-all hover:bg-accent hover:text-accent-foreground",
          checked && "border-primary bg-primary/10",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
RadioCard.displayName = "RadioCard" 