
import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const cardVariants = cva(
  // Base styles following Dubai Government standards
  "rounded-lg border bg-white text-card-foreground transition-all duration-200 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "shadow-[0_2px_8px_rgba(0,110,109,0.1)] hover:shadow-[0_4px_16px_rgba(0,110,109,0.15)]",
        service: "shadow-[0_2px_8px_rgba(0,110,109,0.1)] hover:shadow-[0_4px_16px_rgba(0,110,109,0.15)] hover:border-ehrdc-teal/20 border-ehrdc-neutral-light",
        information: "shadow-[0_2px_8px_rgba(0,110,109,0.1)] hover:shadow-[0_4px_16px_rgba(0,110,109,0.15)] bg-ehrdc-white border-ehrdc-neutral-light",
        profile: "shadow-[0_2px_8px_rgba(0,110,109,0.1)] hover:shadow-[0_4px_16px_rgba(0,110,109,0.15)] border-ehrdc-teal/10 bg-gradient-to-br from-white to-ehrdc-neutral-light/20",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        compact: "p-3",
      },
      interactive: {
        true: "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      interactive: false,
    },
  }
)

export interface DubaiCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
}

const DubaiCard = React.forwardRef<HTMLDivElement, DubaiCardProps>(
  ({ className, variant, size, interactive, asChild = false, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : "div"
    return (
      <Comp
        className={cn(cardVariants({ variant, size, interactive, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
DubaiCard.displayName = "DubaiCard"

const DubaiCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
))
DubaiCardHeader.displayName = "DubaiCardHeader"

const DubaiCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-ehrdc-neutral-dark",
      className
    )}
    {...props}
  />
))
DubaiCardTitle.displayName = "DubaiCardTitle"

const DubaiCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-ehrdc-neutral-dark/70 leading-relaxed", className)}
    {...props}
  />
))
DubaiCardDescription.displayName = "DubaiCardDescription"

const DubaiCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-4", className)} {...props} />
))
DubaiCardContent.displayName = "DubaiCardContent"

const DubaiCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between pt-4 border-t border-ehrdc-neutral-light/50", className)}
    {...props}
  />
))
DubaiCardFooter.displayName = "DubaiCardFooter"

export { 
  DubaiCard, 
  DubaiCardHeader, 
  DubaiCardFooter, 
  DubaiCardTitle, 
  DubaiCardDescription, 
  DubaiCardContent 
}
