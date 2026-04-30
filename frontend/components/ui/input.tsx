import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, helperText, error, ...props }, ref) => {
    const inputId = React.useId();
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-12 w-full rounded-lg border bg-[var(--primary-800)] px-4 py-3 text-base text-[var(--text-primary)] transition-all",
            "placeholder:text-[var(--text-muted)]",
            "focus:outline-none focus:ring-3 focus:ring-[var(--accent-blue)]/20",
            hasError
              ? "border-[var(--accent-rose)] focus:border-[var(--accent-rose)] focus:ring-[var(--accent-rose)]/20"
              : "border-[var(--border-primary)] focus:border-[var(--accent-blue)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
        {(helperText || error) && (
          <p
            className={cn(
              "text-xs",
              hasError ? "text-[var(--accent-rose)]" : "text-[var(--text-muted)]"
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
