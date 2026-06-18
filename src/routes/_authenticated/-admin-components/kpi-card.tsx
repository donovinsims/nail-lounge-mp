import { type ElementType } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  icon?: ElementType;
  trend?: { direction: "up" | "down"; value: string };
  sub?: string;
  chart?: React.ReactNode;
  className?: string;
}

/**
 * KPI stat card — TypeUI-inspired enriched metric widget.
 *
 * - Icon + label row at top
 * - Large bold value
 * - Optional trend badge (up/down with %)
 * - Optional sub text (e.g. "12 checkouts")
 * - Optional sparkline/chart area
 */
export function KpiCard({ label, value, icon: Icon, trend, sub, chart, className }: KpiCardProps) {
  return (
    <div className={cn("rounded-2xl bg-surface p-5 flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium",
              trend.direction === "up"
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      {chart && <div className="mt-1">{chart}</div>}
    </div>
  );
}
