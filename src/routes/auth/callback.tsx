import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

function CallbackPage() {
  const navigate = useNavigate();
  useEffect(() => {
    let cancelled = false;

    // Listen for the auth state change (handles PKCE exchange completion)
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!cancelled) {
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          navigate({ to: session ? "/admin" : "/auth", replace: true });
        }
      }
    });

    // Also try immediate getSession (covers code-exchange-on-load)
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancelled) {
        navigate({ to: data.session ? "/admin" : "/auth", replace: true });
      }
    })();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Completing sign in…
    </div>
  );
}

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: CallbackPage,
});
