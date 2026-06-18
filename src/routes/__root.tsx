import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

// TODO: Replace with a branded OG image on your own domain after deploy.
// Current URL is a generated preview on Cloudflare R2 — works for now but should
// be swapped for /og-image.jpg in public/ once you have one.
const OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ac3d18b7-2275-40d8-873c-ea7183ee4f13/id-preview-90fe0b6c--a0e6aeda-fff0-4bdc-8a55-de8fec4c877c.lovable.app-1781667178638.png";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex tap-target items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

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
          className="mt-6 rounded-full bg-primary px-6 py-3 text-sm text-primary-foreground"
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
      { name: "theme-color", content: "#0a0a0a" },
      { title: "Nail Lounge — Book your appointment" },
      {
        name: "description",
        content:
          "Book your manicure, pedicure, or acrylic appointment at Nail Lounge in Machesney Park, IL.",
      },
      { property: "og:title", content: "Nail Lounge — Book your appointment" },
      {
        property: "og:description",
        content:
          "Book your manicure, pedicure, or acrylic appointment at Nail Lounge in Machesney Park, IL.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Nail Lounge — Book your appointment" },
      {
        name: "twitter:description",
        content:
          "Book your manicure, pedicure, or acrylic appointment at Nail Lounge in Machesney Park, IL.",
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
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NailSalon",
          name: "Nail Lounge",
          image: OG_IMAGE,
          telephone: "+1-815-977-3443",
          email: "wait4alove@yahoo.com",
          priceRange: "$$",
          address: {
            "@type": "PostalAddress",
            streetAddress: "1513 West Lane Rd",
            addressLocality: "Machesney Park",
            addressRegion: "IL",
            postalCode: "61115",
            addressCountry: "US",
          },
          geo: { "@type": "GeoCoordinates", latitude: 42.3403, longitude: -89.042 },
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              opens: "09:30",
              closes: "19:30",
            },
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: "Saturday",
              opens: "09:30",
              closes: "18:00",
            },
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: "Sunday",
              opens: "10:00",
              closes: "17:00",
            },
          ],
          sameAs: [
            "https://www.facebook.com/nailloungemachesneypark",
            "https://www.instagram.com/nailloungemachesneypark",
            "https://www.tiktok.com/@nailloungemp",
            "https://www.yelp.com/biz/nail-lounge-machesney-park",
            "https://booksy.com/en-us/323657_nail-lounge_nail-salon_19333_machesney-park",
          ],
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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
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
      </ThemeProvider>
    </QueryClientProvider>
  );
}
