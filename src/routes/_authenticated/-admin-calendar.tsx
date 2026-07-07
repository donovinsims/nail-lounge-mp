import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { fmtTime } from "@/lib/salon";
import { StatusBadge } from "./-admin-components/status-badge";

type CalendarBooking = Pick<
  Database["public"]["Tables"]["bookings"]["Row"],
  "id" | "start_time" | "end_time" | "status" | "staff_id"
> & {
  services: { name: string; price: number } | null;
  staff: { name: string; avatar_color: string | null } | null;
  clients: { name: string } | null;
};

type CalendarStaff = Pick<
  Database["public"]["Tables"]["staff"]["Row"],
  "id" | "name" | "avatar_color"
>;

const HOURS = Array.from({ length: 12 }, (_, i) => 9 + i); // 9a–8p

function formatHour(hour: number) {
  return `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? "p" : "a"}`;
}

export default function CalendarView({ salonId }: { salonId: string }) {
  const [date, setDate] = useState(() => new Date());
  const [expanded, setExpanded] = useState<string | null>(null);

  // Fetch staff for this salon
  const { data: staffList = [] } = useQuery({
    queryKey: ["cal-staff", salonId],
    queryFn: async () => {
      const { data } = await supabase
        .from("staff")
        .select("id, name, avatar_color")
        .eq("salon_id", salonId);
      return data ?? [];
    },
  });

  // Fetch bookings for the selected date
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
          "id, start_time, end_time, status, staff_id, services(name, price), staff(name, avatar_color), clients(name)",
        )
        .eq("salon_id", salonId)
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString())
        .order("start_time");
      return data ?? [];
    },
  });

  // Filter staff to only those with bookings today
  const staffIdsWithBookings = new Set(bookings.map((b: CalendarBooking) => b.staff_id));
  const staffWithBookings = staffList.filter((s: CalendarStaff) => staffIdsWithBookings.has(s.id));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build flat grid: corner + staff headers, then hour rows
  const gridCols = `80px repeat(${Math.max(staffWithBookings.length, 1)}, minmax(180px, 1fr))`;

  const gridItems: React.ReactNode[] = [];

  // Header row — corner cell
  gridItems.push(
    <div
      key="corner"
      className="p-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border"
    />,
  );

  // Staff column headers
  if (staffWithBookings.length === 0) {
    gridItems.push(
      <div
        key="no-staff-header"
        className="p-3 text-xs text-muted-foreground border-b border-border border-l border-border"
      >
        Bookings
      </div>,
    );
  } else {
    staffWithBookings.forEach((s: CalendarStaff) => {
      gridItems.push(
        <div
          key={`h-${s.id}`}
          className="flex items-center gap-2 p-3 text-sm font-semibold border-b border-border border-l border-border"
        >
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: s.avatar_color || "#888" }}
          />
          <span className="truncate">{s.name}</span>
        </div>,
      );
    });
  }

  // Hour rows
  HOURS.forEach((hour) => {
    // Time label
    gridItems.push(
      <div
        key={`t-${hour}`}
        className="p-2 text-xs font-mono text-muted-foreground border-b border-border"
      >
        {formatHour(hour)}
      </div>,
    );

    if (staffWithBookings.length === 0) {
      // Single "Bookings" column when no staff with bookings
      const items = bookings.filter(
        (b: CalendarBooking) => new Date(b.start_time).getHours() === hour,
      );
      gridItems.push(
        <div
          key={`c-${hour}`}
          className="p-1.5 space-y-1 min-h-[56px] border-b border-border border-l border-border"
        >
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground/50 px-2 py-1">—</p>
          ) : (
            items.map((b: CalendarBooking) => renderBookingCard(b, expanded, setExpanded))
          )}
        </div>,
      );
    } else {
      staffWithBookings.forEach((staff: CalendarStaff) => {
        const items = bookings.filter(
          (b: CalendarBooking) =>
            b.staff_id === staff.id && new Date(b.start_time).getHours() === hour,
        );
        gridItems.push(
          <div
            key={`c-${hour}-${staff.id}`}
            className="p-1.5 space-y-1 min-h-[56px] border-b border-border border-l border-border"
          >
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 px-2 py-1">—</p>
            ) : (
              items.map((b: CalendarBooking) => renderBookingCard(b, expanded, setExpanded))
            )}
          </div>,
        );
      });
    }
  });

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
          {staffWithBookings.length > 0 && ` · ${staffWithBookings.length} staff`}
        </span>
      </div>

      {/* Multi-staff grid */}
      <div className="rounded-2xl bg-surface overflow-x-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: gridCols,
            minWidth:
              staffWithBookings.length > 0 ? `${80 + staffWithBookings.length * 200}px` : undefined,
          }}
        >
          {gridItems}
        </div>
      </div>
    </div>
  );
}

/** Compact booking card used inside grid cells */
function renderBookingCard(
  b: CalendarBooking,
  expanded: string | null,
  setExpanded: (id: string | null) => void,
) {
  const isExpanded = expanded === b.id;
  const avatarColor = b.staff?.avatar_color || "#888";

  return (
    <button
      key={b.id}
      onClick={() => setExpanded(isExpanded ? null : b.id)}
      className={`w-full text-left rounded-lg p-2 transition-all ${
        isExpanded ? "ring-2 ring-primary/30 shadow-sm" : "hover:shadow-sm"
      }`}
      style={{ background: avatarColor + "18" }}
    >
      <p className="text-xs font-semibold truncate">{b.clients?.name}</p>
      <p className="text-[10px] text-muted-foreground truncate">
        {fmtTime(b.start_time)} · {b.services?.name}
      </p>
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground space-y-0.5">
          <p>
            <span className="font-medium text-foreground">Price:</span> ${b.services?.price || "—"}
          </p>
          <p>
            <span className="font-medium text-foreground">Ends:</span>{" "}
            {b.end_time ? fmtTime(b.end_time) : "—"}
          </p>
          <div className="pt-0.5">
            <StatusBadge status={b.status} />
          </div>
        </div>
      )}
    </button>
  );
}
