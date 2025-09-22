
import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-3", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        // Base styles - Dubai Government standard
        "aspect-square h-5 w-5 rounded-full border-2 border-ehrdc-neutral-light bg-white",
        "ring-offset-background transition-all duration-200",
        
        // Focus states with EHRDC teal
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ehrdc-teal/20",
        "focus-visible:ring-offset-2",
        
        // Hover states
        "hover:border-ehrdc-teal/50",
        
        // Checked states
        "data-[state=checked]:border-ehrdc-teal",
        
        // Disabled states
        "disabled:cursor-not-allowed disabled:opacity-50",
        
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-3 w-3 fill-ehrdc-teal text-ehrdc-teal" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
