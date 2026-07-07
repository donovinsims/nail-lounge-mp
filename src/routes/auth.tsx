import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSalonName } from "@/lib/env";
import { toast } from "sonner";
import { Loader2, ChevronLeft, Mail } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: `Sign in — ${getSalonName()} Admin` }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setMagicLinkSent(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    if (data.url) {
      window.location.href = data.url;
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background px-5 py-6 safe-pt">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <div className="mx-auto mt-12 max-w-sm">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
          Sign in
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Sign in</h1>

        {magicLinkSent ? (
          <div className="mt-8 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Magic link sent to <span className="font-medium text-foreground">{email}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Check your inbox and click the link to sign in. You can close this tab.
            </p>
            <button
              onClick={() => {
                setMagicLinkSent(false);
                setEmail("");
              }}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={sendMagicLink} className="mt-6 space-y-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="Email"
                className="w-full tap-target rounded-xl bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                disabled={loading}
                className="flex w-full tap-target items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send magic link
              </button>
            </form>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
            </div>
            <button
              onClick={google}
              disabled={loading}
              className="flex w-full tap-target items-center justify-center gap-2 rounded-xl bg-surface py-3 font-medium hairline disabled:opacity-50"
            >
              Continue with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
