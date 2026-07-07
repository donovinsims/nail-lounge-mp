import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { seedDemoData } from "@/lib/admin.functions";
import { fmtMoney, fmtTime } from "@/lib/salon";
import { getErrorMessage } from "@/lib/error-handler";
import {
  LayoutGrid,
  Sparkles,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  PieChart,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

import { Bar, BarChart, Pie, PieChart as RePieChart, ResponsiveContainer, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

import { KpiCard } from "./-admin-components/kpi-card";
import { StatusBadge } from "./-admin-components/status-badge";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type CrRow = Database["public"]["Tables"]["commission_records"]["Row"];

interface BookingWithRelations extends BookingRow {
  services: { name: string; price: number } | null;
  staff: { name: string } | null;
  clients: { name: string } | null;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", emoji: "☕" };
  if (h < 17) return { text: "Good afternoon", emoji: "☀️" };
  return { text: "Good evening", emoji: "🌙" };
}

export default function Dashboard({ salonId, ownerName }: { salonId: string; ownerName?: string }) {
  const qc = useQueryClient();
  const seed = useServerFn(seedDemoData);

  // Today's bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-bookings", salonId],
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const { data } = await supabase
        .from("bookings")
        .select("id, start_time, status, services(name, price), staff(name), clients(name)")
        .eq("salon_id", salonId)
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString())
        .order("start_time");
      return data ?? [];
    },
  });

  // Today's commission records (for revenue)
  const { data: cr = [] } = useQuery({
    queryKey: ["admin-cr-today", salonId],
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("commission_records")
        .select("*")
        .eq("salon_id", salonId)
        .gte("created_at", start.toISOString());
      return data ?? [];
    },
  });

  // Yesterday's commission records (for trend comparison)
  const { data: yesterdayCr = [] } = useQuery({
    queryKey: ["admin-cr-yesterday", salonId],
    queryFn: async () => {
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      const { data } = await supabase
        .from("commission_records")
        .select("*")
        .eq("salon_id", salonId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
      return data ?? [];
    },
  });

  // Weekly commission records (for chart)
  const { data: weekCr = [] } = useQuery({
    queryKey: ["admin-cr-week", salonId],
    queryFn: async () => {
      const { start, end } = getWeekRange();
      const { data } = await supabase
        .from("commission_records")
        .select("*")
        .eq("salon_id", salonId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
      return data ?? [];
    },
  });

  // Weekly bookings (for chart)
  const { data: weekBookings = [] } = useQuery({
    queryKey: ["admin-bookings-week", salonId],
    queryFn: async () => {
      const { start, end } = getWeekRange();
      const { data } = await supabase
        .from("bookings")
        .select("status, start_time")
        .eq("salon_id", salonId)
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString());
      return data ?? [];
    },
  });

  // Today's completed bookings (for payment method breakdown)
  const { data: todayCompletedBookings = [] } = useQuery({
    queryKey: ["admin-completed-bookings", salonId],
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const { data } = await supabase
        .from("bookings")
        .select("payment_method, tip_amount")
        .eq("salon_id", salonId)
        .not("completed_at", "is", null)
        .gte("completed_at", start.toISOString())
        .lte("completed_at", end.toISOString());
      return data ?? [];
    },
  });

  // Compute KPIs
  const todayRev = cr.reduce(
    (a: number, c: CrRow) => a + Number(c.gross_amount) + Number(c.tip_amount),
    0,
  );
  const yesterdayRev = yesterdayCr.reduce(
    (a: number, c: CrRow) => a + Number(c.gross_amount) + Number(c.tip_amount),
    0,
  );
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const trendVal =
    yesterdayRev > 0 ? `${(((todayRev - yesterdayRev) / yesterdayRev) * 100).toFixed(0)}%` : "—";

  // Weekly revenue by day (bar chart data)
  const weekRevenueData = WEEKDAYS.map((day, i) => {
    const dayStart = new Date(getWeekRange().start);
    dayStart.setDate(dayStart.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayCr = weekCr.filter((c: CrRow) => {
      const d = new Date(c.created_at);
      return d >= dayStart && d <= dayEnd;
    });
    const rev = dayCr.reduce(
      (a: number, c: CrRow) => a + Number(c.gross_amount) + Number(c.tip_amount),
      0,
    );
    // Count total bookings for this day too
    const count = weekBookings.filter((b) => {
      const d = new Date(b.start_time);
      return d >= dayStart && d <= dayEnd;
    }).length;

    return { day: day.slice(0, 3), revenue: rev, bookings: count };
  });

  const maxRev = Math.max(...weekRevenueData.map((d) => d.revenue), 1);

  // Status distribution (donut chart)
  const statusCounts = weekBookings.reduce(
    (acc: Record<string, number>, b: { status: string }) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const STATUS_COLORS: Record<string, string> = {
    confirmed: "var(--color-chart-1)",
    completed: "var(--color-chart-2)",
    cancelled: "var(--color-chart-3)",
    no_show: "var(--color-chart-5)",
  };
  const statusDonutData = Object.entries(statusCounts)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " "),
      count,
      fill: STATUS_COLORS[status] || "var(--color-chart-4)",
    }));

  // Payment method breakdown
  const totalTipsToday = todayCompletedBookings.reduce(
    (sum: number, b: Pick<BookingRow, "payment_method" | "tip_amount">) =>
      sum + Number(b.tip_amount || 0),
    0,
  );
  const paymentMethodBreakdown = todayCompletedBookings.reduce(
    (
      acc: Record<string, { count: number; tips: number }>,
      b: Pick<BookingRow, "payment_method" | "tip_amount">,
    ) => {
      const method = b.payment_method || "Unknown";
      if (!acc[method]) acc[method] = { count: 0, tips: 0 };
      acc[method].count += 1;
      acc[method].tips += Number(b.tip_amount || 0);
      return acc;
    },
    {} as Record<string, { count: number; tips: number }>,
  );

  const chartConfig: ChartConfig = {
    revenue: { label: "Revenue", color: "var(--color-chart-1)" },
    bookings: { label: "Bookings", color: "var(--color-chart-2)" },
  };

  const donutConfig: ChartConfig = Object.fromEntries(
    statusDonutData.map((d) => [d.status, { label: d.status, color: d.fill }]),
  );

  const seeded = useRef(false);

  // Auto-seed demo data on first mount if the dashboard is empty
  useEffect(() => {
    if (seeded.current) return;
    const check = async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("salon_id", salonId)
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString());
      if (count === 0) {
        seeded.current = true;
        try {
          const r = await seed();
          if (r?.ok) {
            toast.success(
              `Loaded ${r.bookings || 0} sample bookings and ${r.commissions || 0} commission records for you to explore`,
              { duration: 4000 },
            );
            qc.invalidateQueries();
          }
        } catch {
          // seed may fail if data already exists or permissions aren't ready
        }
      }
    };
    check();
  }, []);

  const greet = greeting();

  return (
    <div className="space-y-6">
      {/* Welcome greeting */}
      <div className="rounded-2xl bg-surface p-5">
        <p className="text-lg font-semibold flex items-center gap-2">
          <span>{greet.emoji}</span>
          <span>
            {greet.text}, {ownerName ?? "Andy"}
          </span>
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here's your business snapshot for today
        </p>
      </div>

      {/* KPI Widget Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Today's bookings"
          value={String(bookings.length)}
          icon={Calendar}
          sub={`${confirmed} confirmed`}
        />
        <KpiCard
          label="Revenue today"
          value={fmtMoney(todayRev)}
          icon={DollarSign}
          trend={{
            direction: todayRev >= yesterdayRev ? "up" : "down",
            value: trendVal,
          }}
          sub={`${cr.length} checkouts`}
        />
        <KpiCard
          label="Confirmed"
          value={String(confirmed)}
          icon={Users}
          sub={
            bookings.length > 0
              ? `${((confirmed / bookings.length) * 100).toFixed(0)}% of total`
              : "No bookings yet"
          }
        />
        <KpiCard
          label="Avg ticket"
          value={cr.length > 0 ? fmtMoney(todayRev / cr.length) : "$0"}
          icon={TrendingUp}
          sub={`${cr.length} transactions`}
        />
      </div>

      {/* Chart Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue by day bar chart */}
        <div className="rounded-2xl bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Revenue this week</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {fmtMoney(weekRevenueData.reduce((a, d) => a + d.revenue, 0))} total
              </p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <ChartContainer config={chartConfig} className="aspect-[2/1]">
            <BarChart data={weekRevenueData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <ChartTooltip
                cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                content={<ChartTooltipContent />}
              />
              <Bar
                dataKey="revenue"
                fill="var(--color-revenue)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Status distribution donut chart */}
        <div className="rounded-2xl bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Booking status</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {weekBookings.length} total this week
              </p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PieChart className="h-4 w-4" />
            </div>
          </div>
          {statusDonutData.length > 0 ? (
            <ChartContainer config={donutConfig} className="aspect-[2/1]">
              <RePieChart margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={statusDonutData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {statusDonutData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </RePieChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="rounded-2xl bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Payment Methods</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fmtMoney(totalTipsToday)} in tips collected today
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CreditCard className="h-4 w-4" />
          </div>
        </div>
        {todayCompletedBookings.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {Object.entries(paymentMethodBreakdown).map(([method, data]) => (
              <div key={method} className="rounded-xl bg-surface-2 px-4 py-3 flex-1 min-w-[140px]">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {method}
                </p>
                <p className="text-lg font-bold mt-0.5">{data.count}</p>
                <p className="text-xs text-muted-foreground">{fmtMoney(data.tips)} tips</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
            No completed bookings today
          </div>
        )}
      </div>

      {/* Today's schedule */}
      <div className="rounded-2xl bg-surface">
        <div className="flex items-center justify-between p-5">
          <div>
            <h3 className="font-semibold">Today's schedule</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                const r = await seed();
                toast.success(`Seeded ${r?.bookings || 0} bookings`);
                qc.invalidateQueries();
              } catch (e: unknown) {
                toast.error(getErrorMessage(e, "Failed to seed"));
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" /> Seed demo
          </button>
        </div>
        <ul className="divide-y divide-border">
          {bookings.length === 0 && (
            <li className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-2">
              <Calendar className="h-8 w-8 text-muted-foreground/40" />
              <span>No bookings today.</span>
            </li>
          )}
          {bookings.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2/50"
            >
              <span className="font-mono text-sm tabular-nums text-muted-foreground min-w-[60px]">
                {fmtTime(b.start_time)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {b.services?.name}
                  <span className="text-muted-foreground"> · {b.clients?.name}</span>
                </p>
                <p className="text-xs text-muted-foreground">with {b.staff?.name}</p>
              </div>
              <StatusBadge status={b.status} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
