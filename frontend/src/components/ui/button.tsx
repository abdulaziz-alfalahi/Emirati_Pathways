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

/** Stitch-inspired base: clean, no flashy effects, subtle transitions */
const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Primary — EHRDC Teal, subtle shadow on hover
  default:
    "bg-ehrdc-teal text-white hover:bg-ehrdc-dark-teal shadow-sm hover:shadow-md focus-visible:ring-ehrdc-teal/20",
  // Secondary
  secondary:
    "bg-ehrdc-neutral-light text-ehrdc-neutral-dark hover:bg-[#E2E5E9] shadow-sm focus-visible:ring-ehrdc-neutral-dark/20",
  // Outline
  outline:
    "border border-ehrdc-teal bg-white text-ehrdc-teal hover:bg-[#E6F5F5] focus-visible:ring-ehrdc-teal/20",
  // Ghost
  ghost:
    "text-ehrdc-teal hover:bg-ehrdc-teal/8 hover:text-ehrdc-dark-teal focus-visible:ring-ehrdc-teal/20",
  // Link
  link:
    "text-ehrdc-teal underline-offset-4 hover:underline hover:text-ehrdc-dark-teal focus-visible:ring-ehrdc-teal/20",
  // Destructive
  destructive:
    "bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-md focus-visible:ring-red-500/20",
  // Success
  success:
    "bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md focus-visible:ring-green-600/20",
  // Warning
  warning:
    "bg-orange-500 text-white hover:bg-orange-600 shadow-sm hover:shadow-md focus-visible:ring-orange-500/20",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: "h-10 px-5 py-2.5",
  sm: "h-9 px-4 py-2 text-xs",
  lg: "h-12 px-6 py-3",
  xl: "h-14 px-8 py-4 text-base",
  icon: "h-10 w-10",
  "icon-sm": "h-9 w-9",
  "icon-lg": "h-12 w-12",
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
