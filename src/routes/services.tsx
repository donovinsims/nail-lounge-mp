import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchSalon, fetchServices, fmtMoney } from "@/lib/salon";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ArrowRight } from "lucide-react";

const CATEGORY_ORDER = [
  "Core Nail Services",
  "Nail Enhancements",
  "Specialty Nail Art",
  "Hand & Foot Care",
  "Waxing Services",
  "Facial Services",
  "Common Add-Ons",
];

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services & Pricing — Nail Lounge, Machesney Park IL" },
      {
        name: "description",
        content:
          "Full menu of manicures, pedicures, acrylic, gel, dip powder, nail art, waxing, and facials. Transparent pricing at Nail Lounge in Machesney Park, Illinois.",
      },
      { property: "og:title", content: "Services & Pricing — Nail Lounge" },
      {
        property: "og:description",
        content:
          "Full menu and prices for manicures, pedicures, acrylic, gel, dip, nail art, waxing, and facials.",
      },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { data: salon } = useQuery({ queryKey: ["salon"], queryFn: fetchSalon });
  const { data: services = [] } = useQuery({
    queryKey: ["services", salon?.id],
    queryFn: () => fetchServices(salon!.id),
    enabled: !!salon,
  });

  const grouped = CATEGORY_ORDER.map(
    (cat) => [cat, services.filter((s) => s.category === cat)] as const,
  ).filter(([, items]) => items.length > 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-28">
          <p className="text-[11px] uppercase tracking-[0.35em] text-accent">Menu</p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[0.95] tracking-[-0.01em] sm:text-7xl">
            Services & <span className="italic">pricing.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground">
            Clear prices, no surprises. Every service includes shape, cuticle care, and a careful
            finish.
          </p>
          <Link
            to="/book"
            className="mt-10 inline-flex tap-target items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-medium uppercase tracking-[0.18em] text-primary-foreground hover:opacity-90 transition"
          >
            Reserve your seat <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-28">
        {grouped.map(([category, items]) => (
          <section key={category} className="mb-20 last:mb-0">
            <div className="grid gap-10 md:grid-cols-12">
              <header className="md:col-span-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-accent">{category}</p>
                <h2 className="mt-3 font-display text-3xl sm:text-4xl">{category}</h2>
              </header>
              <ul className="md:col-span-8">
                {items.map((s) => {
                  const price = Number(s.price);
                  return (
                    <li
                      key={s.id}
                      className="flex items-baseline justify-between gap-4 border-b border-dashed border-border py-4"
                    >
                      <div className="min-w-0">
                        <p className="font-display text-xl sm:text-2xl">{s.name}</p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          {s.duration_minutes} min
                        </p>
                      </div>
                      <p className="shrink-0 font-mono text-sm tracking-wider">
                        {price === 0 ? "Included" : fmtMoney(price)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        ))}

        <div className="mt-16 rounded-3xl bg-surface p-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-accent">Ready when you are</p>
          <h3 className="mt-4 font-display text-3xl sm:text-4xl">
            Book with your favourite artist.
          </h3>
          <Link
            to="/book"
            className="mt-8 inline-flex tap-target items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-medium uppercase tracking-[0.18em] text-primary-foreground hover:opacity-90 transition"
          >
            Reserve <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
