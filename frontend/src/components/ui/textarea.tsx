
import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * `dir="auto"` by default (#395).
 *
 * Neither of these set a direction before, so a field inherited the page's —
 * and Arabic typed into a form on an English page rendered left-anchored, with
 * punctuation landing on the wrong side. Two separate reports described it.
 *
 * "auto" lets the browser pick from the first strong character in the VALUE, so
 * Arabic reads right-to-left and English left-to-right in the same form. That
 * beats keying off the interface language, which would still be wrong for the
 * common case here: an Arabic name entered while the UI is in English.
 *
 * An explicit `dir` prop still wins — it is spread after this.
 */


export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        dir="auto"
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
