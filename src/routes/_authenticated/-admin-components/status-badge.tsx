import { cn } from "@/lib/utils";

type StatusVariant = "default" | "success" | "warning" | "destructive" | "info" | "muted";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  default: "bg-surface-2 text-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-accent/10 text-accent",
  muted: "bg-muted text-muted-foreground",
};

/**
 * Status badge — colored label for data table rows, cards, and lists.
 *
 * Mapping: confirmed → success, pending → warning, cancelled → destructive,
 * completed → success, with_client → warning, available → success, active → info.
 *
 * Auto-selects variant from common status keywords.
 */
function inferVariant(status: string): StatusVariant {
  const s = status.toLowerCase();
  if (s === "confirmed" || s === "completed" || s === "available" || s === "fulfilled")
    return "success";
  if (s === "pending" || s === "with_client") return "warning";
  if (s === "cancelled" || s === "no_show" || s === "offline") return "destructive";
  if (s === "active") return "info";
  return "default";
}

export function StatusBadge({ status, variant, pulse, className }: StatusBadgeProps) {
  const v = variant ?? inferVariant(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider",
        variantStyles[v],
        pulse &&
          "before:block before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:animate-pulse",
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
