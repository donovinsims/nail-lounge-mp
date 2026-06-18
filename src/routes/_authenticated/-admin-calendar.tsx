import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmtTime } from "@/lib/salon";
import { StatusBadge } from "./-admin-components/status-badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarView({ salonId }: { salonId: string }) {
  const [date, setDate] = useState(() => new Date());
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: bookings = [] } = useQuery({
    queryKey: ["cal", salonId, date.toDateString()],
    queryFn: async () => {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      const { data } = await supabase
        .from("bookings")
        .select(
          "id, start_time, end_time, status, services(name, price), staff(name, avatar_color), clients(name)",
        )
        .eq("salon_id", salonId)
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString())
        .order("start_time");
      return data ?? [];
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      {/* 14-day scrollable date picker */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none">
        {Array.from({ length: 14 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i);
          d.setHours(0, 0, 0, 0);
          const sel = d.toDateString() === date.toDateString();
          const isToday = d.toDateString() === today.toDateString();
          return (
            <button
              key={i}
              onClick={() => setDate(d)}
              className={`shrink-0 flex flex-col items-center rounded-2xl px-4 py-3 transition-all ${
                sel
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-surface hover:bg-surface-2"
              } ${isToday && !sel ? "ring-1 ring-primary/30" : ""}`}
            >
              <span className="text-[10px] uppercase tracking-wider">
                {d.toLocaleDateString("en-US", { weekday: "short" })}
              </span>
              <span className="text-lg font-bold">{d.getDate()}</span>
              {isToday && (
                <span className="text-[8px] uppercase tracking-widest mt-0.5">Today</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Today's date header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold">
          {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </h2>
        <span className="text-xs text-muted-foreground">
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl bg-surface overflow-hidden divide-y divide-border">
        {Array.from({ length: 12 }, (_, i) => {
          const hour = 9 + i;
          const items = bookings.filter(
            (b: any) => new Date(b.start_time).getHours() === hour,
          );
          return (
            <div key={hour}>
              <div className="grid grid-cols-[80px_1fr]">
                <div className="p-3 text-xs font-mono text-muted-foreground border-r border-border">
                  {hour > 12 ? hour - 12 : hour}{hour >= 12 ? "p" : "a"}
                </div>
                <div className="p-2 space-y-1.5 min-h-[56px]">
                  {items.length === 0 && (
                    <p className="text-xs text-muted-foreground/50 px-2 py-1">
                      —
                    </p>
                  )}
                  {items.map((b: any) => {
                    const isExpanded = expanded === b.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setExpanded(isExpanded ? null : b.id)}
                        className={`w-full text-left rounded-xl p-3 transition-all ${
                          isExpanded ? "ring-2 ring-primary/30 shadow-sm" : "hover:shadow-sm"
                        }`}
                        style={{
                          background: (b.staff?.avatar_color || "#888") + "18",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">
                              {b.clients?.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {fmtTime(b.start_time)} · {b.services?.name} · {b.staff?.name}
                            </p>
                          </div>
                          <StatusBadge status={b.status} />
                        </div>
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground space-y-1">
                            <p><span className="font-medium text-foreground">Service:</span> {b.services?.name}</p>
                            {b.services?.price && (
                              <p><span className="font-medium text-foreground">Price:</span> ${b.services.price}</p>
                            )}
                            <p><span className="font-medium text-foreground">Staff:</span> {b.staff?.name}</p>
                            <p><span className="font-medium text-foreground">Ends:</span> {b.end_time ? fmtTime(b.end_time) : "—"}</p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
