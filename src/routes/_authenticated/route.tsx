import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Dev bypass — allows demo without working Supabase auth
    const devBypass = localStorage.getItem("dev-bypass");
    if (devBypass) {
      try {
        const { user } = JSON.parse(devBypass);
        if (user) return { user };
      } catch {
        localStorage.removeItem("dev-bypass");
      }
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
