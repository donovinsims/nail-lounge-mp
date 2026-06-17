import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: () => {
    const navigate = useNavigate();
    useEffect(() => {
      supabase.auth.getSession().then(({ data }) => {
        navigate({ to: data.session ? "/admin" : "/auth" });
      });
    }, [navigate]);
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Completing sign in…</div>;
  },
});
