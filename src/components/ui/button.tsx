import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-[#4A9B67] text-white hover:bg-[#67B084] shadow-md hover:shadow-lg hover:-translate-y-0.5",
  secondary: "bg-white text-[#4A9B67] border-2 border-[#4A9B67] hover:bg-[rgba(74,155,103,0.1)] shadow-sm dark:bg-slate-800 dark:text-[#67B084] dark:border-[#67B084] dark:hover:bg-[rgba(103,176,132,0.15)]",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  ghost: "text-[var(--text-secondary)] hover:bg-[rgba(74,155,103,0.1)] hover:text-[#4A9B67] dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-[#67B084]",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B67] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-slate-900",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
