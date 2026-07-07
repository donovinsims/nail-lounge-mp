import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOwnerAlerts, acknowledgeAlert } from "@/lib/owner-alerts.functions";
import { fmtDate } from "@/lib/salon";
import { AlertTriangle, Check, Phone } from "lucide-react";
import { toast } from "sonner";

function timeSince(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ratingColor(rating: number) {
  if (rating <= 2) return "text-destructive";
  return "text-warning";
}

function ratingLabel(rating: number) {
  if (rating === 1) return "Very dissatisfied";
  if (rating === 2) return "Somewhat dissatisfied";
  return "Neutral / could be better";
}

export default function Alerts({ salonId: _salonId }: { salonId: string }) {
  const qc = useQueryClient();
  const fetchAlerts = useServerFn(getOwnerAlerts);
  const ackAlert = useServerFn(acknowledgeAlert);

  const { data: alerts = [] } = useQuery({
    queryKey: ["owner-alerts"],
    queryFn: () => fetchAlerts(),
  });

  const unacknowledged = alerts.filter((a: any) => !a.acknowledged_at);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await ackAlert({ data: { alertId } });
      toast.success("Alert acknowledged");
      qc.invalidateQueries({ queryKey: ["owner-alerts"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to acknowledge");
    }
  };

  if (unacknowledged.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground gap-3">
        <AlertTriangle className="h-12 w-12 text-muted-foreground/30" />
        <span>No alerts — all ratings have been 4+</span>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {unacknowledged.map((a: any) => (
        <div
          key={a.id}
          className="rounded-2xl bg-surface p-5 transition-colors hover:bg-surface-2/30"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Rating + client phone + time */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-lg font-bold ${ratingColor(a.rating)}`}>
                  {a.rating}/5
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <a
                  href={`tel:${a.client_phone}`}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-mono"
                >
                  <Phone className="h-3 w-3" />
                  {a.client_phone}
                </a>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {fmtDate(a.created_at)}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/60">
                  ({timeSince(a.created_at)})
                </span>
              </div>

              {/* Rating description */}
              <p className="mt-2 text-sm text-muted-foreground">
                {ratingLabel(a.rating)}
              </p>
            </div>

            <button
              onClick={() => handleAcknowledge(a.id)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all shrink-0"
            >
              <Check className="h-4 w-4" /> Acknowledge
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
