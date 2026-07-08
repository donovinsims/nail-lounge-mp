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

    // Fast check: session exists in localStorage (no network)
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw redirect({ to: "/auth" });
    }

    // Verify the token is still valid with the server (network call)
    // Retry once on failure in case of cold-start or transient blip.
    for (let i = 0; i < 2; i++) {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) return { user: data.user };
      if (i === 0 && error?.status === 0) {
        // Network error — wait 500ms and retry
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      break;
    }

    // Check if session expired — redirect to /auth
    await supabase.auth.signOut();
    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
