import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type ComponentType } from "react";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { getSalonName, getSalonNameShort } from "@/lib/env";
import { getMyStaff, linkSelfToFirstSalon } from "@/lib/admin.functions";
import { getOwnerAlerts } from "@/lib/owner-alerts.functions";
import { getErrorMessage } from "@/lib/error-handler";
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  Settings,
  Phone,
  LayoutGrid,
  LogOut,
  Loader2,
  AlertTriangle,
} from "lucide-react";

// Import extracted tab components
import Dashboard from "./-admin-dashboard";
import CalendarView from "./-admin-calendar";
import FloorView from "./-admin-floor";
import Commissions from "./-admin-commissions";
import Waitlist from "./-admin-waitlist";
import Calls from "./-admin-calls";
import Alerts from "./-admin-alerts";
import SettingsView from "./-admin-settings";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: `Admin — ${getSalonName()}` }] }),
  component: Admin,
});

type Tab =
  | "dashboard"
  | "calendar"
  | "floor"
  | "commissions"
  | "alerts"
  | "waitlist"
  | "calls"
  | "settings";

type StaffWithSalon = Database["public"]["Tables"]["staff"]["Row"] & {
  salons: Database["public"]["Tables"]["salons"]["Row"];
};

const NAV: { id: Tab; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "floor", label: "Live Floor", icon: Users },
  { id: "commissions", label: "Commissions", icon: DollarSign },
  { id: "alerts", label: "Alerts", icon: AlertTriangle },
  { id: "waitlist", label: "Waitlist", icon: Clock },
  { id: "calls", label: "AI Calls", icon: Phone },
  { id: "settings", label: "Settings", icon: Settings },
];

/** Extract a friendly first name from the auth user */
function getOwnerName(user?: { user_metadata?: { full_name?: string; name?: string } } | null) {
  if (!user) return "";
  const full = user.user_metadata?.full_name || user.user_metadata?.name;
  if (!full) return "";
  return full.split(" ")[0];
}

function Admin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [ownerName, setOwnerName] = useState("");

  const myStaff = useServerFn(getMyStaff);
  const link = useServerFn(linkSelfToFirstSalon);
  const {
    data: staff,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-staff"],
    queryFn: () => myStaff(),
    retry: 2,
  });
  const [linkError, setLinkError] = useState<string | null>(null);

  // Get the owner's name from auth metadata
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user)
        setOwnerName(
          getOwnerName(
            data.user as {
              id: string;
              email?: string | null;
              user_metadata?: { full_name?: string; name?: string };
            },
          ),
        );
    })();
  }, []);

  // Auto-link to salon if no staff record, with error handling
  useEffect(() => {
    if (!isLoading && !staff && !isError) {
      setLinkError(null);
      (async () => {
        try {
          await link();
          await qc.invalidateQueries({ queryKey: ["my-staff"] });
        } catch (err: unknown) {
          setLinkError(getErrorMessage(err, "Failed to link account to salon"));
        }
      })();
    }
  }, [staff, isLoading, isError, link, qc]);

  // Owner alerts for badge count
  const fetchAlerts = useServerFn(getOwnerAlerts);
  const salonId = (staff as StaffWithSalon | null)?.salons?.id;
  const { data: ownerAlerts = [] } = useQuery({
    queryKey: ["owner-alerts-count", salonId],
    queryFn: () => fetchAlerts(),
    enabled: !!salonId,
  });
  const unacknowledgedCount = ownerAlerts.filter(
    (a: Database["public"]["Tables"]["owner_alerts"]["Row"]) => !a.acknowledged_at,
  ).length;

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError && !staff) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-sm text-muted-foreground">
          {error?.message || "Could not load your staff profile."}
        </p>
        <p className="text-xs text-muted-foreground/60">
          This can happen if your account has duplicate staff records.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Try again
          </button>
          <button
            onClick={signOut}
            className="rounded-xl bg-surface px-5 py-2.5 text-sm font-semibold hairline"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm text-muted-foreground">Linking your account to the salon…</p>
        {linkError && (
          <>
            <p className="text-xs text-destructive">{linkError}</p>
            <button
              onClick={signOut}
              className="rounded-xl bg-surface px-5 py-2.5 text-sm font-semibold hairline"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    );
  }

  const salon = (staff as StaffWithSalon).salons;

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside
        className={`${collapsed ? "w-16" : "w-56"} hidden md:flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all`}
      >
        <button onClick={() => setCollapsed((c) => !c)} className="p-4 text-left">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {collapsed ? getSalonNameShort() : getSalonName()}
          </p>
          {!collapsed && <p className="mt-1 truncate text-sm font-semibold">{salon?.name}</p>}
        </button>
        <nav className="mt-2 flex-1 px-2 space-y-0.5">
          {NAV.map((n) => {
            const isActive = tab === n.id;
            const showBadge = n.id === "alerts" && unacknowledgedCount > 0;
            return (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-accent font-semibold"
                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80"
                }`}
              >
                <n.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="truncate flex items-center gap-2">
                    {n.label}
                    {showBadge && (
                      <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
                        {unacknowledgedCount > 99 ? "99+" : unacknowledgedCount}
                      </span>
                    )}
                  </span>
                )}
                {collapsed && showBadge && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                )}
              </button>
            );
          })}
        </nav>
        {/* Sign-out area with owner name */}
        <div className="border-t border-sidebar-border">
          {!collapsed && (
            <p className="px-5 pt-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
              Signed in as {ownerName || "Owner"}
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
            className={`relative flex flex-col items-center gap-1 py-2 text-[10px] transition-colors ${
              tab === n.id ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <div className="relative">
              <n.icon className="h-5 w-5" />
              {n.id === "alerts" && unacknowledgedCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive" />
              )}
            </div>
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
          {tab === "commissions" && <Commissions salonId={salon!.id} />}
          {tab === "alerts" && <Alerts salonId={salon!.id} />}
          {tab === "waitlist" && <Waitlist salonId={salon!.id} />}
          {tab === "calls" && <Calls salonId={salon!.id} />}
          {tab === "settings" && <SettingsView salon={salon} />}
        </section>
      </main>
    </div>
  );
}
