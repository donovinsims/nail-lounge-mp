import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyStaff, linkSelfToFirstSalon } from "@/lib/admin.functions";
import {
  Calendar,
  Users,
  CreditCard,
  DollarSign,
  Clock,
  Settings,
  Phone,
  LayoutGrid,
  LogOut,
  Loader2,
} from "lucide-react";

// Import extracted tab components
import Dashboard from "./-admin-dashboard";
import CalendarView from "./-admin-calendar";
import FloorView from "./-admin-floor";
import POS from "./-admin-pos";
import Commissions from "./-admin-commissions";
import Waitlist from "./-admin-waitlist";
import Calls from "./-admin-calls";
import SettingsView from "./-admin-settings";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Nail Lounge" }] }),
  component: Admin,
});

type Tab =
  | "dashboard"
  | "calendar"
  | "floor"
  | "pos"
  | "commissions"
  | "waitlist"
  | "calls"
  | "settings";

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

/** Extract a friendly first name from the auth user */
function getOwnerName(user?: { user_metadata?: { full_name?: string; name?: string } } | null) {
  if (!user) return "Andy";
  const full = user.user_metadata?.full_name || user.user_metadata?.name;
  if (!full) return "Andy";
  return full.split(" ")[0];
}

function Admin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [ownerName, setOwnerName] = useState("Andy");

  const myStaff = useServerFn(getMyStaff);
  const link = useServerFn(linkSelfToFirstSalon);
  const { data: staff, isLoading } = useQuery({
    queryKey: ["my-staff"],
    queryFn: () => myStaff(),
  });

  // Get the owner's name from auth metadata
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setOwnerName(getOwnerName(data.user as any));
    });
  }, []);

  useEffect(() => {
    if (!isLoading && !staff) {
      link().then(() => qc.invalidateQueries({ queryKey: ["my-staff"] }));
    }
  }, [staff, isLoading]);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (isLoading || !staff) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const salon = (staff as any).salons;

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside
        className={`${collapsed ? "w-16" : "w-56"} hidden md:flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all`}
      >
        <button onClick={() => setCollapsed((c) => !c)} className="p-4 text-left">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {collapsed ? "NL" : "Nail Lounge"}
          </p>
          {!collapsed && <p className="mt-1 truncate text-sm font-semibold">{salon?.name}</p>}
        </button>
        <nav className="mt-2 flex-1 px-2 space-y-0.5">
          {NAV.map((n) => {
            const isActive = tab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-accent font-semibold"
                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80"
                }`}
              >
                <n.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{n.label}</span>}
              </button>
            );
          })}
        </nav>
        {/* Sign-out area with owner name */}
        <div className="border-t border-sidebar-border">
          {!collapsed && (
            <p className="px-5 pt-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
              Signed in as {ownerName}
            </p>
          )}
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 px-5 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && "Sign out"}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background/95 backdrop-blur safe-pb pt-2">
        {NAV.slice(0, 4).map((n) => (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            className={`flex flex-col items-center gap-1 py-2 text-[10px] transition-colors ${
              tab === n.id ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <n.icon className="h-5 w-5" />
            {n.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 min-w-0 px-5 md:px-10 py-6 pb-24 md:pb-10">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              {NAV.find((n) => n.id === tab)?.label}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight truncate">{salon?.name}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/"
              className="text-xs text-muted-foreground hover:text-foreground hidden sm:inline transition-colors"
            >
              View site →
            </Link>
          </div>
        </header>

        <section className="mt-8">
          {tab === "dashboard" && <Dashboard salonId={salon!.id} ownerName={ownerName} />}
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
