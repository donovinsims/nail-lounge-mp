import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/error-handler";

/**
 * Parse OAuth tokens from the URL hash fragment.
 * Supabase uses implicit flow for OAuth callbacks, returning tokens in #hash.
 */
function parseHashFragment(): { access_token?: string; refresh_token?: string } | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash || !hash.includes("access_token=")) return null;
  const params = new URLSearchParams(hash);
  const access_token = params.get("access_token") || undefined;
  const refresh_token = params.get("refresh_token") || undefined;
  return access_token ? { access_token, refresh_token } : null;
}

/** Remove the hash fragment from the URL after we've consumed the tokens. */
function clearHash() {
  if (typeof window === "undefined") return;
  history.replaceState(null, "", window.location.pathname);
}

function CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let subscription: { unsubscribe: () => void } | undefined;

    async function go(to: string) {
      if (cancelled) return;
      clearHash();
      await navigate({ to, replace: true });
    }

    // Strategy 1: Listen for auth state change (works for PKCE code exchange)
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      // SIGNED_IN fires after a successful OAuth/magic link exchange
      if (event === "SIGNED_IN" && session) {
        go("/admin");
      }
      // INITIAL_SESSION fires once on mount — if session exists, user was already
      // logged in. If null, the SDK is still processing the OAuth code/hash, so
      // we wait for SIGNED_IN or the fallback strategies below.
      if (event === "INITIAL_SESSION" && session) {
        go("/admin");
      }
    });
    subscription = sub.subscription;

    // Strategy 2: Try getSession immediately (covers already-stored session)
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        go("/admin");
        return;
      }

      // Strategy 3: Manual fallback — parse URL hash directly and set session
      const tokens = parseHashFragment();
      if (tokens?.access_token) {
        try {
          const { data: sessionData, error: sessionError } =
            await supabase.auth.setSession({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token || "",
            });
          if (cancelled) return;
          if (sessionData.session) {
            go("/admin");
            return;
          }
          if (sessionError) throw sessionError;
        } catch (err: unknown) {
          if (!cancelled) {
            setError(getErrorMessage(err, "Failed to complete sign in"));
          }
          return;
        }
      }

      // Strategy 4: Wait a moment in case Supabase client is still initializing
      timeoutId = setTimeout(async () => {
        if (cancelled) return;
        const { data: retry } = await supabase.auth.getSession();
        if (cancelled) return;
        if (retry.session) {
          go("/admin");
        } else {
          // Try the hash one more time
          const tokens = parseHashFragment();
          if (tokens?.access_token) {
            try {
              const { data: sessionData } = await supabase.auth.setSession({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token || "",
              });
              if (cancelled) return;
              if (sessionData.session) {
                go("/admin");
                return;
              }
            } catch {
              // fall through to error
            }
          }
          if (!cancelled) {
            setError(
              "Could not complete sign in. The link may have expired. Please try again.",
            );
          }
        }
      }, 2000);
    })();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => navigate({ to: "/auth", replace: true })}
          className="rounded-xl bg-surface px-5 py-2.5 text-sm font-semibold hairline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

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
