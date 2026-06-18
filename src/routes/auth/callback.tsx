import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

function CallbackPage() {
  const navigate = useNavigate();
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) navigate({ to: data.session ? "/admin" : "/auth" });
    }).catch(() => {
      if (!cancelled) navigate({ to: "/auth" });
    });
    return () => {
      cancelled = true;
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
