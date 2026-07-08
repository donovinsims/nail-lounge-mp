import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { ArrowLeft } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import {
  getSalonName,
  getSalonPhone,
  getSalonSocial,
  getOGImage,
  getUmamiWebsiteId,
  getUmamiHost,
} from "@/lib/env";

const OG_IMAGE = getOGImage();

const NotFoundComponent = () => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mb-6 text-8xl font-display font-bold text-primary/20">404</div>
        <h1 className="font-display text-3xl">Page Not Found</h1>
        <p className="mt-3 text-muted-foreground">
          Looks like this page got a little lost. Let's get you back on track.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </div>
    </div>
  );
};

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 h-11 rounded-lg bg-primary px-6 text-sm font-medium tracking-[0.01em] text-primary-foreground shadow-1 transition duration-150 hover:shadow-2 hover:scale-[1.02]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#ede7de" },
      { title: `${getSalonName()} — Book your appointment` },
      {
        name: "description",
        content: `Book your appointment at ${getSalonName()}.`,
      },
      { property: "og:title", content: `${getSalonName()} — Book your appointment` },
      {
        property: "og:description",
        content: `Book your appointment at ${getSalonName()}.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: `${getSalonName()} — Book your appointment` },
      {
        name: "twitter:description",
        content: `Book your appointment at ${getSalonName()}.`,
      },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { rel: "icon", href: "/icon-512.png", type: "image/png", sizes: "512x512" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Figtree:ital,wght@0,300..700;1,400..500&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NailSalon",
          name: getSalonName(),
          ...(OG_IMAGE ? { image: OG_IMAGE } : {}),
          ...(getSalonPhone() ? { telephone: getSalonPhone() } : {}),
          ...(getSalonSocial().email ? { email: getSalonSocial().email } : {}),
          priceRange: "$$",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const umamiId = getUmamiWebsiteId();
  const umamiHost = getUmamiHost();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        {umamiId && <script defer src={`${umamiHost}/script.js`} data-website-id={umamiId} />}
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Outlet />
        <Toaster position="top-center" />
        <Analytics />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
