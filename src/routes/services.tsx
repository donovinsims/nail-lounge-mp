import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchSalon, fetchServices, fmtMoney } from "@/lib/salon";
import { BottomSheet } from "@/components/bottom-sheet";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ArrowRight, Clock, Sparkles } from "lucide-react";

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
  const navigate = useNavigate();
  const { data: salon } = useQuery({ queryKey: ["salon"], queryFn: fetchSalon });
  const { data: services = [] } = useQuery({
    queryKey: ["services", salon?.id],
    queryFn: () => fetchServices(salon!.id),
    enabled: !!salon,
  });

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<(typeof services)[number] | null>(null);

  const grouped = CATEGORY_ORDER.map(
    (cat) => [cat, services.filter((s) => s.category === cat)] as const,
  ).filter(([, items]) => items.length > 0);

  const openServiceSheet = (service: (typeof services)[number]) => {
    setSelectedService(service);
    setSheetOpen(true);
  };

  const bookService = (serviceId: string) => {
    setSheetOpen(false);
    setTimeout(() => navigate({ to: "/book", search: { service: serviceId } as any }), 200);
  };

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
                    <li key={s.id}>
                      <button
                        onClick={() => openServiceSheet(s)}
                        className="group flex w-full items-baseline justify-between gap-4 border-b border-dashed border-border py-4 text-left transition hover:bg-accent/5 active:scale-[0.99] px-3 -mx-3 rounded-lg tap-target"
                      >
                        <div className="min-w-0">
                          <p className="font-display text-xl sm:text-2xl group-hover:text-accent transition-colors">
                            {s.name}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            {s.duration_minutes} min
                          </p>
                        </div>
                        <p className="shrink-0 font-mono text-sm tracking-wider">
                          {price === 0 ? "Included" : fmtMoney(price)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        ))}

        {/* Bottom CTA band */}
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

      {/* Service detail bottom sheet */}
      <BottomSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={selectedService?.name}
      >
        {selectedService && (
          <div className="space-y-6 pb-4">
            <div className="flex items-baseline justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-accent">
                {selectedService.category}
              </p>
              <p className="font-mono text-2xl font-semibold">
                {Number(selectedService.price) === 0
                  ? "Included"
                  : fmtMoney(Number(selectedService.price))}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{selectedService.duration_minutes} minutes</span>
            </div>
            <button
              onClick={() => bookService(selectedService.id)}
              className="flex w-full tap-target items-center justify-center gap-3 rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground hover:opacity-90 transition"
            >
              Book Now <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl px-4 py-3 safe-pb sm:hidden">
        <Link
          to="/book"
          className="flex w-full tap-target items-center justify-center gap-3 rounded-full bg-primary py-4 text-sm font-medium uppercase tracking-[0.18em] text-primary-foreground hover:opacity-90 transition"
        >
          Reserve your seat <Sparkles className="h-4 w-4" />
        </Link>
      </div>

      {/* Spacer for mobile sticky CTA */}
      <div className="h-20 sm:hidden" />

      <SiteFooter />
    </div>
  );
}
