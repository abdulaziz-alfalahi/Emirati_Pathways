
import * as React from "react"
import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ReactNode
  children: React.ReactNode
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn("", className)}
        {...props}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{children}</span>
        </div>
      </Button>
    )
  }
)
IconButton.displayName = "IconButton"

export { IconButton }
