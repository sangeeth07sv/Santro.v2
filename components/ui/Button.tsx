import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const variantClasses: Record<string, string> = {
  primary: "bg-marigold-500 text-indigo-900 hover:bg-marigold-300 active:bg-marigold-600 shadow-card",
  outline: "border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 dark:bg-transparent dark:border-indigo-600 dark:text-slate-100",
  ghost: "text-indigo-700 hover:bg-indigo-50 dark:text-slate-100 dark:hover:bg-indigo-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizeClasses: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
