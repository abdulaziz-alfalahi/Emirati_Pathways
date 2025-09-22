
import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormFieldProps {
  label: string
  description?: string
  error?: string
  success?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, description, error, success, required, children, className }, ref) => {
    const fieldId = React.useId()
    
    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        <label 
          htmlFor={fieldId} 
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative">
          {React.cloneElement(children as React.ReactElement, { 
            id: fieldId,
            'aria-describedby': description || error || success ? `${fieldId}-description` : undefined,
            'aria-invalid': error ? 'true' : 'false',
            className: cn(
              (children as React.ReactElement).props.className,
              error && "border-red-500 focus-visible:ring-red-500",
              success && "border-green-500 focus-visible:ring-green-500"
            )
          })}
        </div>
        
        {(description || error || success) && (
          <div id={`${fieldId}-description`} className="text-sm">
            {error && <p className="text-red-600">{error}</p>}
            {success && <p className="text-green-600">{success}</p>}
            {description && !error && !success && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormField }
