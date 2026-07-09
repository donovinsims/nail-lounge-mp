import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/error-handler";

/**
 * Parse OAuth tokens from the URL hash fragment (implicit flow).
 * Most magic links now use PKCE (?code=) instead, but Google OAuth
 * may still pass tokens in the hash for certain configurations.
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

/** Remove the hash fragment / search params from the URL after consuming tokens. */
function clearUrl() {
  if (typeof window === "undefined") return;
  history.replaceState(null, "", window.location.pathname);
}

function CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let subscription: { unsubscribe: () => void } | undefined;

    async function go(to: string) {
      if (!mounted.current) return;
      clearUrl();
      await navigate({ to, replace: true });
    }

    (async () => {
      // Strategy 0: Wait for the SDK's auto-initialization (constructor
      // already called initialize()). This waits for the shared promise,
      // which processes PKCE code exchange or implicit hash tokens.
      try {
        const initResult = await supabase.auth.initialize();
        if (initResult?.error) {
          console.error("supabase.auth.initialize() error:", initResult.error);
        }
      } catch (err) {
        console.error("supabase.auth.initialize() threw:", err);
      }
      if (!mounted.current) return;

      // Strategy 1: Check if initialization gave us a session
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        go("/admin");
        return;
      }

      // Strategy 2: Listen for auth state change (catches async PKCE
      // exchange or cross-tab session updates)
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted.current) return;
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
          go("/admin");
        }
      });
      subscription = sub.subscription;

      // Strategy 3: Manual PKCE code exchange — try if ?code= is present
      // in the URL (e.g., magic link redirect). This covers the case
      // where the SDK's auto-init missed the code (e.g., verifier was
      // stored but exchange hadn't completed yet).
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        if (code) {
          try {
            const { data: exchangeData, error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(code);
            if (!mounted.current) return;
            if (exchangeData?.session) {
              go("/admin");
              return;
            }
            if (exchangeError) {
              console.warn("exchangeCodeForSession failed:", exchangeError.message);
            }
          } catch (err: unknown) {
            console.warn("exchangeCodeForSession threw:", err);
          }
        }
      }

      // Strategy 4: Manual fallback — parse URL hash directly (implicit flow)
      const tokens = parseHashFragment();
      if (tokens?.access_token) {
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || "",
          });
          if (!mounted.current) return;
          if (sessionData.session) {
            go("/admin");
            return;
          }
          if (sessionError) throw sessionError;
        } catch (err: unknown) {
          if (mounted.current) {
            setError(getErrorMessage(err, "Failed to complete sign in"));
          }
          return;
        }
      }

      // Strategy 5: Wait a moment and retry (catches slow PKCE exchange
      // or delayed session persistence)
      timeoutId = setTimeout(async () => {
        if (!mounted.current) return;
        const { data: retry } = await supabase.auth.getSession();
        if (retry.session) {
          go("/admin");
          return;
        }

        // One more try for PKCE code exchange
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get("code");
          if (code) {
            try {
              const { data: exchangeData } = await supabase.auth.exchangeCodeForSession(code);
              if (exchangeData?.session) {
                go("/admin");
                return;
              }
            } catch {
              // fall through to error
            }
          }
        }

        // One more try for implicit flow
        const tokens = parseHashFragment();
        if (tokens?.access_token) {
          try {
            const { data: sessionData } = await supabase.auth.setSession({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token || "",
            });
            if (sessionData.session) {
              go("/admin");
              return;
            }
          } catch {
            // fall through to error
          }
        }

        if (!mounted.current) return;

        // Build diagnostics for debugging
        const href = window.location.href;
        const diag = [
          `URL: ${href.slice(0, 200)}`,
          `Hash params: ${window.location.hash || "(none)"}`,
          `Search params: ${window.location.search || "(none)"}`,
          `Session in storage: ${!!localStorage.getItem("supabase.auth.token")}`,
        ].join("\n");
        setDebug(diag);

        setError(
          "Could not complete sign in. The link may have expired or the session " +
            "was created on a different device. Please try again.",
        );
      }, 5000);
    })();

    return () => {
      mounted.current = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [navigate]);

  if (error) {
    return (
      <main
        id="main-content"
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center"
      >
        <p className="text-sm text-destructive">{error}</p>
        {debug && (
          <pre className="max-w-lg whitespace-pre-wrap break-all rounded-lg bg-muted px-4 py-3 text-left text-[11px] text-muted-foreground">
            {debug}
          </pre>
        )}
        <button
          onClick={() => navigate({ to: "/auth", replace: true })}
          className="rounded-xl bg-surface px-5 py-2.5 text-sm font-semibold hairline"
        >
          Back to sign in
        </button>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center text-sm text-muted-foreground"
    >
      Completing sign in…
    </main>
  );
}

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: CallbackPage,
});
