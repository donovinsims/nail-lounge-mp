import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyStaff, linkSelfToFirstSalon, completeBookingWithPayment, seedDemoData } from "@/lib/admin.functions";
import { fmtDate, fmtTime, fmtMoney } from "@/lib/salon";
import { Calendar, Users, CreditCard, DollarSign, Clock, Settings, Phone, LayoutGrid, LogOut, Loader2, Sparkles, Download, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Nail Lounge" }] }),
  component: Admin,
});

type Tab = "dashboard" | "calendar" | "floor" | "pos" | "commissions" | "waitlist" | "calls" | "settings";

const NAV: { id: Tab; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "floor", label: "Live Floor", icon: Users },
  { id: "pos", label: "POS", icon: CreditCard },
  { id: "commissions", label: "Commissions", icon: DollarSign },
  { id: "waitlist", label: "Waitlist", icon: Clock },
  { id: "calls", label: "AI Calls", icon: Phone },
  { id: "settings", label: "Settings", icon: Settings },
];

function Admin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const myStaff = useServerFn(getMyStaff);
  const link = useServerFn(linkSelfToFirstSalon);
  const { data: staff, isLoading } = useQuery({ queryKey: ["my-staff"], queryFn: () => myStaff() });

  useEffect(() => {
    if (!isLoading && !staff) {
      link().then(() => qc.invalidateQueries({ queryKey: ["my-staff"] }));
    }
  }, [staff, isLoading]);

  const signOut = async () => {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (isLoading || !staff) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const salon = (staff as any).salons;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className={`${collapsed ? "w-16" : "w-56"} hidden md:flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all`}>
        <button onClick={() => setCollapsed((c) => !c)} className="p-4 text-left">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{collapsed ? "NL" : "Nail Lounge"}</p>
          {!collapsed && <p className="mt-1 truncate text-sm font-semibold">{salon?.name}</p>}
        </button>
        <nav className="mt-2 flex-1 px-2 space-y-0.5">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${tab === n.id ? "bg-sidebar-accent font-semibold" : "hover:bg-sidebar-accent/50"}`}>
              <n.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{n.label}</span>}
            </button>
          ))}
        </nav>
        <button onClick={signOut} className="flex items-center gap-3 px-5 py-4 text-sm text-muted-foreground hover:text-foreground border-t border-sidebar-border">
          <LogOut className="h-4 w-4" />{!collapsed && "Sign out"}
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background/95 backdrop-blur safe-pb">
        {NAV.slice(0, 4).map((n) => (
          <button key={n.id} onClick={() => setTab(n.id)} className={`flex flex-col items-center gap-1 py-2 text-[10px] ${tab === n.id ? "text-foreground" : "text-muted-foreground"}`}>
            <n.icon className="h-5 w-5" />{n.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 min-w-0 px-5 md:px-10 py-6 pb-24 md:pb-10">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{NAV.find(n => n.id === tab)?.label}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight truncate">{salon?.name}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground hidden sm:inline">View site →</Link>
          </div>
        </header>

        <section className="mt-8">
          {tab === "dashboard" && <Dashboard salonId={salon!.id} />}
          {tab === "calendar" && <CalendarView salonId={salon!.id} />}
          {tab === "floor" && <FloorView salonId={salon!.id} />}
          {tab === "pos" && <POS salonId={salon!.id} />}
          {tab === "commissions" && <Commissions salonId={salon!.id} />}
          {tab === "waitlist" && <Waitlist salonId={salon!.id} />}
          {tab === "calls" && <Calls salonId={salon!.id} />}
          {tab === "settings" && <SettingsView salon={salon} />}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-surface p-5">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Dashboard({ salonId }: { salonId: string }) {
  const qc = useQueryClient();
  const seed = useServerFn(seedDemoData);
  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-bookings", salonId],
    queryFn: async () => {
      const start = new Date(); start.setHours(0,0,0,0);
      const end = new Date(); end.setHours(23,59,59,999);
      const { data } = await supabase.from("bookings")
        .select("id, start_time, status, deposit_paid, services(name, price), staff(name), clients(name)")
        .eq("salon_id", salonId)
        .gte("start_time", start.toISOString()).lte("start_time", end.toISOString())
        .order("start_time");
      return data ?? [];
    },
  });
  const { data: cr = [] } = useQuery({
    queryKey: ["admin-cr-today", salonId],
    queryFn: async () => {
      const start = new Date(); start.setHours(0,0,0,0);
      const { data } = await supabase.from("commission_records").select("*").eq("salon_id", salonId).gte("created_at", start.toISOString());
      return data ?? [];
    },
  });

  const todayRev = cr.reduce((a, c) => a + Number(c.gross_amount) + Number(c.tip_amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Today's bookings" value={String(bookings.length)} />
        <Stat label="Revenue today" value={fmtMoney(todayRev)} sub={`${cr.length} checkouts`} />
        <Stat label="Confirmed" value={String(bookings.filter((b: any) => b.status === "confirmed").length)} />
      </div>
      <div className="rounded-2xl bg-surface">
        <div className="flex items-center justify-between p-5">
          <h3 className="font-semibold">Today's schedule</h3>
          <button onClick={() => seed().then((r: any) => { toast.success(`Seeded ${r.bookings || 0} bookings`); qc.invalidateQueries(); })} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Seed demo
          </button>
        </div>
        <ul className="divide-y divide-border">
          {bookings.length === 0 && <li className="p-5 text-sm text-muted-foreground">No bookings today.</li>}
          {bookings.map((b: any) => (
            <li key={b.id} className="grid grid-cols-[80px_1fr_auto] items-center gap-3 p-5">
              <span className="font-mono text-sm">{fmtTime(b.start_time)}</span>
              <div className="min-w-0">
                <p className="truncate font-medium">{b.services?.name} · {b.clients?.name}</p>
                <p className="text-xs text-muted-foreground">with {b.staff?.name}</p>
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full ${b.status === 'completed' ? 'bg-success/10 text-success' : 'bg-surface-2'}`}>{b.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CalendarView({ salonId }: { salonId: string }) {
  const [date, setDate] = useState(() => new Date());
  const { data: bookings = [] } = useQuery({
    queryKey: ["cal", salonId, date.toDateString()],
    queryFn: async () => {
      const start = new Date(date); start.setHours(0,0,0,0);
      const end = new Date(date); end.setHours(23,59,59,999);
      const { data } = await supabase.from("bookings")
        .select("id, start_time, end_time, status, services(name), staff(name, avatar_color), clients(name)")
        .eq("salon_id", salonId)
        .gte("start_time", start.toISOString()).lte("start_time", end.toISOString())
        .order("start_time");
      return data ?? [];
    },
  });

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-4">
        {Array.from({ length: 14 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() + i); d.setHours(0,0,0,0);
          const sel = d.toDateString() === date.toDateString();
          return (
            <button key={i} onClick={() => setDate(d)} className={`shrink-0 flex flex-col items-center rounded-2xl px-4 py-3 ${sel ? "bg-primary text-primary-foreground" : "bg-surface"}`}>
              <span className="text-[10px] uppercase">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
              <span className="text-lg font-bold">{d.getDate()}</span>
            </button>
          );
        })}
      </div>
      <div className="rounded-2xl bg-surface overflow-hidden">
        {Array.from({ length: 12 }, (_, i) => {
          const hour = 9 + i;
          const items = bookings.filter((b: any) => new Date(b.start_time).getHours() === hour);
          return (
            <div key={hour} className="grid grid-cols-[80px_1fr] border-b border-border last:border-0 min-h-[64px]">
              <div className="p-3 text-xs font-mono text-muted-foreground border-r border-border">{hour}:00</div>
              <div className="p-2 space-y-1">
                {items.map((b: any) => (
                  <div key={b.id} className="rounded-lg p-2 text-xs" style={{ background: (b.staff?.avatar_color || "#000") + "22" }}>
                    <p className="font-semibold truncate">{fmtTime(b.start_time)} · {b.services?.name}</p>
                    <p className="text-muted-foreground truncate">{b.clients?.name} · {b.staff?.name}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FloorView({ salonId }: { salonId: string }) {
  const qc = useQueryClient();
  const { data: floor = [] } = useQuery({
    queryKey: ["floor", salonId],
    queryFn: async () => {
      const { data } = await supabase.from("floor_status").select("*, staff(name, avatar_color)").eq("salon_id", salonId);
      return data ?? [];
    },
  });
  useEffect(() => {
    const ch = supabase.channel("floor-" + salonId)
      .on("postgres_changes", { event: "*", schema: "public", table: "floor_status", filter: `salon_id=eq.${salonId}` },
        () => qc.invalidateQueries({ queryKey: ["floor", salonId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [salonId, qc]);

  const cycle = async (id: string, current: string) => {
    const next = current === "available" ? "with_client" : current === "with_client" ? "offline" : "available";
    await supabase.from("floor_status").update({ status: next, updated_at: new Date().toISOString() }).eq("id", id);
  };

  const color = (s: string) => s === "available" ? "bg-success/15 text-success" : s === "with_client" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {floor.map((f: any) => (
        <button key={f.id} onClick={() => cycle(f.id, f.status)} className="rounded-2xl bg-surface p-5 text-left active:scale-[0.99]">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 rounded-full grid place-items-center text-white font-semibold" style={{ background: f.staff?.avatar_color }}>
              {f.staff?.name?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{f.staff?.name}</p>
              <span className={`mt-1 inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${color(f.status)}`}>
                {f.status.replace("_", " ")}
              </span>
            </div>
          </div>
        </button>
      ))}
      <p className="text-xs text-muted-foreground col-span-full">Tap to cycle status · live updates via realtime</p>
    </div>
  );
}

function POS({ salonId }: { salonId: string }) {
  const qc = useQueryClient();
  const complete = useServerFn(completeBookingWithPayment);
  const [sel, setSel] = useState<any>(null);
  const [tip, setTip] = useState(0);
  const [tipSplit, setTipSplit] = useState(100);
  const [paying, setPaying] = useState(false);

  const { data: bookings = [] } = useQuery({
    queryKey: ["pos-open", salonId],
    queryFn: async () => {
      const { data } = await supabase.from("bookings")
        .select("id, start_time, services(name, price), staff(name), clients(name)")
        .eq("salon_id", salonId).eq("status", "confirmed")
        .order("start_time");
      return data ?? [];
    },
  });

  const checkout = async () => {
    setPaying(true);
    await new Promise((r) => setTimeout(r, 1200)); // mock tap
    try {
      const r: any = await complete({ data: { bookingId: sel.id, tipAmount: tip, tipToTechPercent: tipSplit } });
      toast.success(`Paid. Tech: ${fmtMoney(r.techShare + r.tipToTech)}`);
      setSel(null); setTip(0);
      qc.invalidateQueries();
    } catch (e: any) { toast.error(e.message); } finally { setPaying(false); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl bg-surface">
        <h3 className="p-5 font-semibold">Open tickets</h3>
        <ul className="divide-y divide-border">
          {bookings.length === 0 && <li className="p-5 text-sm text-muted-foreground">No open tickets.</li>}
          {bookings.map((b: any) => (
            <li key={b.id}>
              <button onClick={() => { setSel(b); setTip(0); }} className={`w-full grid grid-cols-[1fr_auto] items-center gap-3 p-4 text-left hover:bg-surface-2 ${sel?.id === b.id ? "bg-surface-2" : ""}`}>
                <div className="min-w-0">
                  <p className="truncate font-medium">{b.clients?.name} · {b.services?.name}</p>
                  <p className="text-xs text-muted-foreground">{b.staff?.name} · {fmtTime(b.start_time)}</p>
                </div>
                <span className="font-mono text-sm">{fmtMoney(Number(b.services?.price))}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl bg-surface p-5">
        {!sel ? <p className="text-sm text-muted-foreground">Select a ticket to take payment.</p> : (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Ticket</p>
              <p className="mt-1 text-lg font-semibold">{sel.clients?.name}</p>
              <p className="text-sm text-muted-foreground">{sel.services?.name} · {sel.staff?.name}</p>
            </div>
            <div className="flex items-baseline justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">Subtotal</span><span className="font-mono text-lg">{fmtMoney(Number(sel.services?.price))}</span>
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Tip ${tip}</label>
              <input type="range" min={0} max={50} value={tip} onChange={(e) => setTip(Number(e.target.value))} className="w-full" />
              <div className="mt-2 flex gap-2">
                {[0, 5, 10, 15, 20].map((t) => (
                  <button key={t} onClick={() => setTip(t)} className={`tap-target flex-1 rounded-lg text-sm ${tip === t ? "bg-primary text-primary-foreground" : "bg-surface-2"}`}>${t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Tip split: {tipSplit}% tech / {100 - tipSplit}% salon</label>
              <input type="range" min={0} max={100} step={10} value={tipSplit} onChange={(e) => setTipSplit(Number(e.target.value))} className="w-full" />
            </div>
            <div className="flex items-baseline justify-between text-lg font-semibold">
              <span>Total</span><span className="font-mono">{fmtMoney(Number(sel.services?.price) + tip)}</span>
            </div>
            <button disabled={paying} onClick={checkout} className="flex w-full tap-target items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-50">
              {paying ? <><Loader2 className="h-4 w-4 animate-spin" /> Tap card on terminal...</> : <><CreditCard className="h-4 w-4" /> Charge {fmtMoney(Number(sel.services?.price) + tip)}</>}
            </button>
            <p className="text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Stripe Terminal · Mock</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Commissions({ salonId }: { salonId: string }) {
  const { data: rows = [] } = useQuery({
    queryKey: ["cr", salonId],
    queryFn: async () => {
      const { data } = await supabase.from("commission_records")
        .select("*, staff(name), bookings(start_time, services(name))")
        .eq("salon_id", salonId).order("created_at", { ascending: false }).limit(200);
      return data ?? [];
    },
  });

  const exportCsv = () => {
    const headers = ["Date", "Tech", "Service", "Gross", "Tech share", "Salon share", "Tip", "Tip→Tech"];
    const lines = [headers.join(",")].concat(rows.map((r: any) => [
      new Date(r.created_at).toISOString(), r.staff?.name, r.bookings?.services?.name,
      r.gross_amount, r.tech_share, r.salon_share, r.tip_amount, r.tip_to_tech,
    ].join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "commissions.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const total = rows.reduce((a: number, r: any) => a + Number(r.tech_share) + Number(r.tip_to_tech), 0);

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Stat label="Records" value={String(rows.length)} />
        <Stat label="Tech earnings" value={fmtMoney(total)} />
        <Stat label="Salon earnings" value={fmtMoney(rows.reduce((a: number, r: any) => a + Number(r.salon_share) + Number(r.tip_to_salon), 0))} />
      </div>
      <div className="flex justify-end mb-3">
        <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg bg-surface px-4 py-2 text-sm hairline"><Download className="h-4 w-4" /> Export CSV</button>
      </div>
      <div className="rounded-2xl bg-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <tr><th className="p-4">Date</th><th>Tech</th><th>Service</th><th>Gross</th><th>Tech</th><th>Salon</th><th>Tip</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r: any) => (
              <tr key={r.id}>
                <td className="p-4 font-mono text-xs">{fmtDate(r.created_at)}</td>
                <td>{r.staff?.name}</td>
                <td>{r.bookings?.services?.name}</td>
                <td className="font-mono">{fmtMoney(Number(r.gross_amount))}</td>
                <td className="font-mono">{fmtMoney(Number(r.tech_share) + Number(r.tip_to_tech))}</td>
                <td className="font-mono">{fmtMoney(Number(r.salon_share) + Number(r.tip_to_salon))}</td>
                <td className="font-mono">{fmtMoney(Number(r.tip_amount))}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No records yet. Complete a POS checkout.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Waitlist({ salonId }: { salonId: string }) {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["wl", salonId],
    queryFn: async () => {
      const { data } = await supabase.from("waitlist_entries").select("*, staff(name), services(name)").eq("salon_id", salonId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const [form, setForm] = useState({ client_name: "", client_phone: "" });
  const add = async () => {
    if (!form.client_name || !form.client_phone) return;
    await supabase.from("waitlist_entries").insert({ salon_id: salonId, ...form, preferred_time_windows: [] });
    setForm({ client_name: "", client_phone: "" }); qc.invalidateQueries();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-surface p-5 flex flex-wrap gap-2">
        <input placeholder="Client name" value={form.client_name} onChange={(e) => setForm({...form, client_name: e.target.value})} className="flex-1 min-w-[150px] tap-target rounded-lg bg-surface-2 px-3" />
        <input placeholder="Phone" value={form.client_phone} onChange={(e) => setForm({...form, client_phone: e.target.value})} className="flex-1 min-w-[150px] tap-target rounded-lg bg-surface-2 px-3" />
        <button onClick={add} className="tap-target rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground">Add</button>
      </div>
      <ul className="space-y-2">
        {rows.map((r: any) => (
          <li key={r.id} className="rounded-2xl bg-surface p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{r.client_name}</p>
              <p className="text-xs text-muted-foreground">{r.client_phone}</p>
              {r.flagged_booking_id && <p className="mt-2 text-xs font-mono uppercase tracking-wider text-success">⚡ Slot opened</p>}
            </div>
            <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full ${r.status === 'active' ? 'bg-surface-2' : 'bg-success/10 text-success'}`}>{r.status}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-muted-foreground p-4">No waitlist entries.</li>}
      </ul>
    </div>
  );
}

function Calls({ salonId }: { salonId: string }) {
  const navigate = useNavigate();
  const { data: rows = [] } = useQuery({
    queryKey: ["calls", salonId],
    queryFn: async () => {
      const { data } = await supabase.from("ai_calls").select("*").eq("salon_id", salonId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  return (
    <ul className="space-y-3">
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No AI calls yet. Use the Seed demo button on the dashboard.</p>}
      {rows.map((c: any) => (
        <li key={c.id} className="rounded-2xl bg-surface p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <p className="font-semibold truncate">{c.caller_name} · {c.caller_phone}</p>
              <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Intent: {c.intent}</p>
              <p className="mt-3 text-sm">"{c.transcript}"</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground shrink-0">{fmtDate(c.created_at)}</span>
          </div>
          {c.intent === "book_appointment" && !c.converted_booking_id && (
            <button onClick={() => navigate({ to: "/book" })} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              <Check className="h-4 w-4" /> Convert to booking
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function SettingsView({ salon }: { salon: any }) {
  const qc = useQueryClient();
  const [name, setName] = useState(salon.name); const [phone, setPhone] = useState(salon.phone || "");
  const [commission, setCommission] = useState(Number(salon.commission_split));
  const [tipSplit, setTipSplit] = useState(Number(salon.tip_split_default));

  const save = async () => {
    const { error } = await supabase.from("salons").update({
      name, phone, commission_split: commission, tip_split_default: tipSplit,
    }).eq("id", salon.id);
    if (error) return toast.error(error.message);
    toast.success("Saved"); qc.invalidateQueries({ queryKey: ["my-staff"] });
  };

  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-2xl bg-surface p-5 space-y-3">
        <h3 className="font-semibold">Business</h3>
        <label className="block"><span className="text-xs text-muted-foreground">Salon name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full tap-target rounded-lg bg-surface-2 px-3" /></label>
        <label className="block"><span className="text-xs text-muted-foreground">Phone</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full tap-target rounded-lg bg-surface-2 px-3" /></label>
      </div>
      <div className="rounded-2xl bg-surface p-5 space-y-3">
        <h3 className="font-semibold">Commission & tips</h3>
        <label className="block"><span className="text-xs text-muted-foreground">Tech commission: {commission}%</span>
          <input type="range" min={0} max={100} value={commission} onChange={(e) => setCommission(Number(e.target.value))} className="w-full" /></label>
        <label className="block"><span className="text-xs text-muted-foreground">Default tip to tech: {tipSplit}%</span>
          <input type="range" min={0} max={100} value={tipSplit} onChange={(e) => setTipSplit(Number(e.target.value))} className="w-full" /></label>
      </div>
      <button onClick={save} className="tap-target rounded-lg bg-primary px-6 font-semibold text-primary-foreground">Save changes</button>
      <p className="text-xs text-muted-foreground">Hours and holiday schedules per salon are stored as JSON in the salon record and can be edited here in a future update.</p>
    </div>
  );
}
