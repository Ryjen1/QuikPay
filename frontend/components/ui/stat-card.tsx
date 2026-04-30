import * as React from "react";
import { cn } from "../../lib/utils";
import { Card, CardContent } from "./card";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    { className, label, value, unit, trend, trendDirection = "neutral", icon, ...props },
    ref
  ) => {
    const getTrendColor = () => {
      switch (trendDirection) {
        case "up":
          return "text-[var(--accent-teal)]";
        case "down":
          return "text-[var(--accent-rose)]";
        default:
          return "text-[var(--text-tertiary)]";
      }
    };

    const getTrendIcon = () => {
      switch (trendDirection) {
        case "up":
          return (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          );
        case "down":
          return (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
              />
            </svg>
          );
        default:
          return null;
      }
    };

    return (
      <Card ref={ref} className={cn("p-6", className)} {...props}>
        <CardContent className="p-0 space-y-3">
          {/* Label */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
              {label}
            </p>
            {icon && (
              <div className="text-[var(--accent-blue)] opacity-60">
                {icon}
              </div>
            )}
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              {value}
            </p>
            {unit && (
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                {unit}
              </span>
            )}
          </div>

          {/* Trend */}
          {trend && (
            <div className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
              {getTrendIcon()}
              <span>{trend}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
StatCard.displayName = "StatCard";

export { StatCard };
