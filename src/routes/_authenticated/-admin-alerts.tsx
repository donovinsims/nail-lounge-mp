import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { OwnerAlertRow } from "@/integrations/supabase/rows";
import {
  getOwnerAlerts,
  acknowledgeAlert,
  getCustomerHistory,
  type CustomerHistoryEntry,
} from "@/lib/owner-alerts.functions";
import { fmtDate, fmtMoney } from "@/lib/utils";
import { BottomSheet } from "@/components/bottom-sheet";
import { AlertTriangle, Check, Phone, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-handler";

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
  const fetchHistory = useServerFn(getCustomerHistory);

  const [search, setSearch] = useState("");
  const [alertSheetId, setAlertSheetId] = useState<string | null>(null);
  const [custSheetId, setCustSheetId] = useState<string | null>(null);

  const { data: alerts = [] } = useQuery({
    queryKey: ["owner-alerts"],
    queryFn: () => fetchAlerts(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customer-history"],
    queryFn: () => fetchHistory(),
  });

  const unacknowledged = alerts.filter((a: OwnerAlertRow) => !a.acknowledged_at);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await ackAlert({ data: { alertId } });
      toast.success("Alert acknowledged");
      qc.invalidateQueries({ queryKey: ["owner-alerts"] });
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Failed to acknowledge"));
    }
  };

  const filtered = customers.filter(
    (c: CustomerHistoryEntry) =>
      c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search),
  );

  return (
    <div className="space-y-6">
      {/* ───────── Alerts Section ───────── */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Unacknowledged Alerts
          {unacknowledged.length > 0 && (
            <span className="rounded-full bg-destructive/10 text-destructive text-[11px] font-semibold px-2 py-0.5">
              {unacknowledged.length}
            </span>
          )}
        </h2>

        {unacknowledged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-2 rounded-2xl bg-surface">
            <AlertTriangle className="h-8 w-8 text-muted-foreground/30" />
            <span>No alerts — all ratings have been 4+</span>
          </div>
        ) : (
          <div className="grid gap-3">
            {unacknowledged.map((a: OwnerAlertRow) => (
              <div
                key={a.id}
                className="rounded-2xl bg-surface p-5 transition-colors hover:bg-surface-2/30"
              >
                {/* Desktop: static card with inline acknowledge */}
                <div className="hidden md:flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
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
                    <p className="mt-2 text-sm text-muted-foreground">{ratingLabel(a.rating)}</p>
                  </div>

                  <button
                    onClick={() => handleAcknowledge(a.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all shrink-0"
                  >
                    <Check className="h-4 w-4" /> Acknowledge
                  </button>
                </div>

                {/* Mobile: trigger button */}
                <button
                  onClick={() => setAlertSheetId(a.id)}
                  className="md:hidden w-full text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-lg font-bold ${ratingColor(a.rating)}`}>
                          {a.rating}/5
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground font-mono">
                          <Phone className="h-3 w-3" />
                          {a.client_phone}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {fmtDate(a.created_at)}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground/60">
                          ({timeSince(a.created_at)})
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{ratingLabel(a.rating)}</p>
                    </div>
                  </div>
                </button>

                <BottomSheet
                  open={alertSheetId === a.id}
                  onOpenChange={(o) => !o && setAlertSheetId(null)}
                  title={<span className={ratingColor(a.rating)}>Rating: {a.rating}/5</span>}
                  footer={
                    <button
                      onClick={() => handleAcknowledge(a.id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
                    >
                      <Check className="h-4 w-4" /> Acknowledge
                    </button>
                  }
                >
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a
                        href={`tel:${a.client_phone}`}
                        className="font-mono text-primary hover:underline"
                      >
                        {a.client_phone}
                      </a>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-mono text-xs">{fmtDate(a.created_at)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Time since</span>
                      <span className="font-mono text-xs">{timeSince(a.created_at)}</span>
                    </div>

                    <div className="rounded-lg bg-surface-2 px-3 py-2.5">
                      <p className="text-sm text-muted-foreground">{ratingLabel(a.rating)}</p>
                    </div>
                  </div>
                </BottomSheet>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ───────── Customer History Section ───────── */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customer History
          <span className="text-sm font-normal text-muted-foreground">
            ({customers.length} total)
          </span>
        </h2>

        <div className="rounded-2xl bg-surface p-5">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 pl-9 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          {customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-2">
              <Users className="h-8 w-8 text-muted-foreground/30" />
              <span>No customers yet</span>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Name</th>
                      <th className="pb-3 pr-4 font-medium">Phone</th>
                      <th className="pb-3 pr-4 font-medium text-right">Visits</th>
                      <th className="pb-3 pr-4 font-medium text-right">Spent</th>
                      <th className="pb-3 pr-4 font-medium text-right">Tips</th>
                      <th className="pb-3 pr-4 font-medium">Last Visit</th>
                      <th className="pb-3 pr-4 font-medium">Staff</th>
                      <th className="pb-3 pr-4 font-medium">Service</th>
                      <th className="pb-3 pr-4 font-medium text-right">Rating</th>
                      <th className="pb-3 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c: CustomerHistoryEntry) => (
                      <tr
                        key={c.id}
                        className="border-b border-border/50 transition-colors hover:bg-surface-2/30"
                      >
                        <td className="py-3 pr-4 font-medium truncate max-w-[140px]">{c.name}</td>
                        <td className="py-3 pr-4 font-mono text-muted-foreground text-xs">
                          {c.phone}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          {c.totalVisits}
                          <span className="text-muted-foreground text-[10px] ml-1">
                            ({c.completedVisits} done)
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums font-medium">
                          {fmtMoney(c.totalSpent)}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                          {fmtMoney(c.totalTips)}
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                          {c.lastVisit ? fmtDate(c.lastVisit) : "—"}
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground truncate max-w-[100px]">
                          {c.lastStaff || "—"}
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground truncate max-w-[120px]">
                          {c.lastService || "—"}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {c.lastRating != null ? (
                            <span
                              className={
                                c.lastRating <= 2
                                  ? "text-destructive-ink font-bold"
                                  : c.lastRating <= 3
                                    ? "text-warning-ink font-bold"
                                    : "text-success-ink font-bold"
                              }
                            >
                              {c.lastRating}/5
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="py-3 text-xs text-muted-foreground italic truncate max-w-[160px]">
                          {c.lastNotes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden grid gap-2">
                {filtered.map((c: CustomerHistoryEntry) => (
                  <div key={c.id}>
                    <button
                      onClick={() => setCustSheetId(c.id)}
                      className="w-full text-left rounded-xl bg-surface-2 p-4 text-sm space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-xs font-mono text-muted-foreground">{c.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{c.totalVisits} visits</span>
                        <span>{fmtMoney(c.totalSpent)} spent</span>
                        <span>{fmtMoney(c.totalTips)} tips</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {c.lastVisit && <span>Last: {fmtDate(c.lastVisit)}</span>}
                        {c.lastStaff && <span>· {c.lastStaff}</span>}
                        {c.lastRating != null && (
                          <span
                            className={
                              c.lastRating <= 2
                                ? "text-destructive-ink font-semibold"
                                : c.lastRating <= 3
                                  ? "text-warning-ink font-semibold"
                                  : "text-success-ink font-semibold"
                            }
                          >
                            {c.lastRating}/5
                          </span>
                        )}
                      </div>
                      {c.lastNotes && (
                        <p className="text-xs text-muted-foreground italic">"{c.lastNotes}"</p>
                      )}
                    </button>

                    <BottomSheet
                      open={custSheetId === c.id}
                      onOpenChange={(o) => !o && setCustSheetId(null)}
                      title={c.name}
                      footer={
                        <a
                          href={`tel:${c.phone}`}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
                        >
                          <Phone className="h-4 w-4" /> Call {c.phone}
                        </a>
                      }
                    >
                      <div className="space-y-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <a
                            href={`tel:${c.phone}`}
                            className="font-mono text-primary hover:underline"
                          >
                            {c.phone}
                          </a>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-lg bg-surface-2 p-3 text-center">
                            <p className="text-lg font-bold tabular-nums">{c.totalVisits}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                              Visits
                            </p>
                            <p className="text-[10px] text-muted-foreground/60">
                              ({c.completedVisits} done)
                            </p>
                          </div>
                          <div className="rounded-lg bg-surface-2 p-3 text-center">
                            <p className="text-lg font-bold tabular-nums">
                              {fmtMoney(c.totalSpent)}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                              Spent
                            </p>
                          </div>
                          <div className="rounded-lg bg-surface-2 p-3 text-center">
                            <p className="text-lg font-bold tabular-nums">
                              {fmtMoney(c.totalTips)}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                              Tips
                            </p>
                          </div>
                        </div>

                        {c.lastVisit && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Last visit</span>
                            <span className="font-mono text-xs">{fmtDate(c.lastVisit)}</span>
                          </div>
                        )}

                        {c.lastStaff && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Staff</span>
                            <span className="text-xs">{c.lastStaff}</span>
                          </div>
                        )}

                        {c.lastService && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Service</span>
                            <span className="text-xs">{c.lastService}</span>
                          </div>
                        )}

                        {c.lastRating != null && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Rating</span>
                            <span
                              className={
                                c.lastRating <= 2
                                  ? "text-destructive-ink font-bold"
                                  : c.lastRating <= 3
                                    ? "text-warning-ink font-bold"
                                    : "text-success-ink font-bold"
                              }
                            >
                              {c.lastRating}/5
                            </span>
                          </div>
                        )}

                        {c.lastNotes && (
                          <div className="rounded-lg bg-surface-2 px-3 py-2.5">
                            <p className="text-xs text-muted-foreground italic">"{c.lastNotes}"</p>
                          </div>
                        )}
                      </div>
                    </BottomSheet>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  No customers match "{search}"
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
