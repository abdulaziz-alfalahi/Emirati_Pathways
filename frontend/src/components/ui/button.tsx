// src/components/ui/button.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/** Variants & sizes we support */
type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "link"
  | "destructive"
  | "success"
  | "warning";

type ButtonSize = "default" | "sm" | "lg" | "xl" | "icon" | "icon-sm" | "icon-lg";

/** Base + variant/size class maps (mirrors your previous design) */
const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group active:scale-[0.98]";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Primary with shine effect
  default:
    "bg-ehrdc-teal text-white hover:bg-ehrdc-dark-teal shadow-md hover:shadow-lg hover:shadow-ehrdc-teal/25 focus-visible:ring-ehrdc-teal/20 transform hover:-translate-y-0.5 before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-all before:duration-700 hover:before:left-[100%] before:skew-x-12",
  // Secondary
  secondary:
    "bg-ehrdc-neutral-light text-ehrdc-neutral-dark hover:bg-ehrdc-neutral-light/80 shadow-sm hover:shadow-md hover:shadow-ehrdc-neutral-dark/10 focus-visible:ring-ehrdc-neutral-dark/20 hover:-translate-y-0.5",
  // Outline
  outline:
    "border-2 border-ehrdc-teal bg-white text-ehrdc-teal hover:bg-ehrdc-teal hover:text-white shadow-sm hover:shadow-md hover:shadow-ehrdc-teal/25 focus-visible:ring-ehrdc-teal/20 hover:-translate-y-0.5 before:absolute before:inset-0 before:bg-ehrdc-teal before:scale-x-0 before:origin-left before:transition-transform before:duration-300 hover:before:scale-x-100 before:-z-10",
  // Ghost
  ghost:
    "text-ehrdc-teal hover:bg-ehrdc-teal/10 hover:text-ehrdc-dark-teal focus-visible:ring-ehrdc-teal/20 after:absolute after:inset-0 after:rounded-lg after:bg-ehrdc-teal/10 after:scale-0 after:transition-transform after:duration-200 hover:after:scale-100",
  // Link
  link:
    "text-ehrdc-teal underline-offset-4 hover:underline hover:text-ehrdc-dark-teal focus-visible:ring-ehrdc-teal/20 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-ehrdc-teal after:transition-all after:duration-300 hover:after:w-full",
  // States
  destructive:
    "bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg hover:shadow-red-500/25 focus-visible:ring-red-500/20 hover:-translate-y-0.5",
  success:
    "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg hover:shadow-green-600/25 focus-visible:ring-green-600/20 hover:-translate-y-0.5",
  warning:
    "bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg hover:shadow-orange-500/25 focus-visible:ring-orange-500/20 hover:-translate-y-0.5",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: "h-12 px-6 py-3",
  sm: "h-10 px-4 py-2 text-xs",
  lg: "h-14 px-8 py-4 text-base",
  xl: "h-16 px-10 py-5 text-lg",
  icon: "h-12 w-12",
  "icon-sm": "h-10 w-10",
  "icon-lg": "h-14 w-14",
};

/**
 * Replacement for the cva helper – returns full className string.
 * Kept as `buttonVariants` so other imports continue to work.
 */
export function buttonVariants(opts: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
} = {}) {
  const variant = opts.variant ?? "default";
  const size = opts.size ?? "default";
  const loadingCls = opts.loading ? "cursor-not-allowed" : "";
  return cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], loadingCls, opts.className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style */
  variant?: ButtonVariant;
  /** Size scale */
  size?: ButtonSize;
  /** Render child element instead of <button> (shadcn-style) */
  asChild?: boolean;
  /** Loading state disables button and shows spinner */
  loading?: boolean;
  /** Optional text shown next to spinner when loading */
  loadingText?: string;
}

/** Minimal asChild behavior without @radix-ui/react-slot */
function renderAsChild(
  child: React.ReactNode,
  props: React.ButtonHTMLAttributes<HTMLElement> & { className?: string },
  ref: React.Ref<any>
) {
  if (!React.isValidElement(child)) return null;
  const prev = (child.props as any).className;
  return React.cloneElement(child as any, {
    ...props,
    ref,
    className: cn(prev, props.className),
  });
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      loading = false,
      loadingText,
      asChild = false,
      children = "Click me",
      disabled,
      ...props
    },
    ref
  ) => {
    const classes = buttonVariants({ variant, size, loading, className });
    const isDisabled = disabled || loading;

    const content = loading ? (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{loadingText || "Loading..."}</span>
      </div>
    ) : (
      children
    );

    if (asChild) {
      // Render the single child element with merged props/classes
      return renderAsChild(content, { ...props, className: classes, disabled: isDisabled }, ref) as any;
    }

    return (
      <button ref={ref} className={classes} disabled={isDisabled} {...props}>
        {content}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
