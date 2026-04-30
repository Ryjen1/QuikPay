/* eslint-disable react-refresh/only-export-components */

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-semibold transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent-blue)] text-white shadow-sm hover:bg-[var(--accent-blue-dark)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-blue)] active:translate-y-0 focus-visible:ring-[var(--accent-blue)]/50",
        secondary:
          "bg-transparent text-[var(--neutral-50)] border-[1.5px] border-[var(--neutral-200)] hover:bg-[var(--primary-600)] hover:border-[var(--accent-blue)] focus-visible:ring-[var(--accent-blue)]/50",
        ghost:
          "bg-transparent text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/10 focus-visible:ring-[var(--accent-blue)]/50",
        success:
          "bg-[var(--accent-teal)] text-white shadow-sm hover:bg-[var(--accent-teal-dark)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-teal)] active:translate-y-0 focus-visible:ring-[var(--accent-teal)]/50",
        warning:
          "bg-[var(--accent-amber)] text-white shadow-sm hover:bg-[var(--accent-amber-dark)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-[var(--accent-amber)]/50",
        danger:
          "bg-[var(--accent-rose)] text-white shadow-sm hover:bg-[var(--accent-rose-dark)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-[var(--accent-rose)]/50",
        outline:
          "border border-[var(--border-primary)] bg-transparent hover:bg-[var(--primary-700)] text-[var(--neutral-50)]",
      },
      size: {
        sm: "h-9 px-3 text-sm gap-1.5 [&_svg:not([class*='size-'])]:size-4",
        md: "h-10 px-4 text-sm gap-2 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-12 px-6 text-base gap-2 [&_svg:not([class*='size-'])]:size-5",
        xl: "h-14 px-8 text-lg gap-2.5 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-10 [&_svg:not([class*='size-'])]:size-5",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof ButtonPrimitive>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = ({
  className,
  variant,
  size,
  fullWidth,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) => {
  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </ButtonPrimitive>
  );
};

export default Button;
