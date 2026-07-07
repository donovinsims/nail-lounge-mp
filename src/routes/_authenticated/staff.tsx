import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getMyStaff } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/staff")({
  ssr: false,
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });

    // Verify the user is linked to a staff record
    try {
      const staff = await getMyStaff();
      if (!staff || staff.role === "owner") {
        throw redirect({ to: "/admin" });
      }
    } catch {
      throw redirect({ to: "/auth" });
    }
  },
  component: StaffLayout,
});

function StaffLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-sm font-medium">Staff Portal</span>
          <nav className="flex gap-4 text-sm">
            <Link to="/staff" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link to="/staff/appointments" className="text-muted-foreground hover:text-foreground">
              Appointments
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
