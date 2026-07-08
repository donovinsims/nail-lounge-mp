import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchSalon, fetchStaff, fetchServices, asBusinessHours, type DayKey } from "@/lib/salon";

import type { StaffRow } from "@/integrations/supabase/rows";
import {
  getSalonName,
  getSalonAddress,
  getSalonPhone,
  getSalonPhoneHref,
  getSalonSocial,
} from "@/lib/env";
import { MapPin, Phone, Clock, ArrowRight, Instagram, Star, Mail } from "lucide-react";
import heroImg from "@/assets/studio.jpg";
import art1 from "@/assets/art1.jpg";
import art2 from "@/assets/art2.jpg";
import art3 from "@/assets/art3.jpg";
import g1 from "@/assets/gallery1.jpg";
import { SiteHeader, SiteFooter, MapEmbed } from "@/components/site-chrome";
import { Skeleton } from "@/components/ui/skeleton";
import { WaveDivider } from "@/components/wave-divider";
import { BookingCTA } from "@/components/booking-cta";

type Staff = Pick<
  StaffRow,
  | "id"
  | "salon_id"
  | "name"
  | "title"
  | "bio"
  | "specialties"
  | "avatar_url"
  | "avatar_color"
  | "sort_order"
  | "working_hours"
  | "is_active"
  | "created_at"
>;

const DAYS: [string, DayKey][] = [
  ["Monday", "mon"],
  ["Tuesday", "tue"],
  ["Wednesday", "wed"],
  ["Thursday", "thu"],
  ["Friday", "fri"],
  ["Saturday", "sat"],
  ["Sunday", "sun"],
];

const DAY_SHORT: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export const Route = createFileRoute("/")({
  head: () => {
    const social = getSalonSocial();
    const socialUrls = [
      social.instagram && `https://instagram.com/${social.instagram}`,
      social.facebook && `https://facebook.com/${social.facebook}`,
      social.tiktok && `https://tiktok.com/@${social.tiktok}`,
      social.yelp && social.yelp,
    ].filter(Boolean) as string[];
    return {
      meta: [
        { title: `${getSalonName()} — Manicures, Pedicures & Nail Art` },
        {
          name: "description",
          content: `Precision manicures, pedicures, gel, acrylic, and modern nail art. Book online in 60 seconds at ${getSalonName()}.`,
        },
        { property: "og:title", content: `${getSalonName()} — Salon Services` },
        {
          property: "og:description",
          content: "Manicures, pedicures, gel, acrylic, and nail art.",
        },
        { property: "og:image", content: heroImg },
        { property: "og:url", content: "/" },
      ],
      links: [{ rel: "canonical", href: "/" }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HairSalon",
            name: getSalonName(),
            image: heroImg,
            address: { "@type": "PostalAddress", streetAddress: getSalonAddress() },
            telephone: getSalonPhone(),
            url: "/",
            sameAs: socialUrls.length > 0 ? socialUrls : undefined,
            priceRange: "$$",
          }),
        },
      ],
    };
  },
  component: Home,
});

function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 12" className={className} aria-hidden="true">
      <line x1="0" y1="6" x2="48" y2="6" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="60" cy="6" r="2.2" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="60" cy="6" r="0.8" fill="currentColor" />
      <line x1="72" y1="6" x2="120" y2="6" stroke="currentColor" strokeWidth="0.6" />
    </svg>
  );
}

function Home() {
  const { data: salon } = useQuery({ queryKey: ["salon"], queryFn: fetchSalon });
  const { data: staff = [], isFetching: staffLoading } = useQuery({
    queryKey: ["staff", salon?.id],
    queryFn: () => fetchStaff(salon!.id),
    enabled: !!salon,
  });
  const { data: services = [] } = useQuery({
    queryKey: ["services", salon?.id],
    queryFn: () => fetchServices(salon!.id),
    enabled: !!salon,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 pt-16 pb-20 sm:px-10 sm:pt-24 md:grid-cols-12 md:gap-12 md:pt-32">
          <div className="md:col-span-6 md:pt-8">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-accent font-mono text-[0.7rem] tracking-[0.12em] uppercase">
              <Star className="size-3 fill-current" /> Neighborhood studio · est.{" "}
              {salon?.created_at ? new Date(salon.created_at).getFullYear() : "2019"}
            </span>
            <h1 className="mt-6 font-display text-6xl leading-[0.92] tracking-[-0.02em] sm:text-7xl lg:text-8xl">
              The quiet
              <br />
              <span className="italic font-normal text-accent">artistry</span>
              <br />
              of the hand.
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground">
              A considered studio for precision manicures, pedicures, acrylic sculpture, and modern
              nail art — precision nail care.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/book"
                className="inline-flex tap-target items-center gap-3 rounded-lg bg-primary h-12 px-7 text-sm font-medium tracking-[0.01em] text-primary-foreground shadow-1 transition duration-150 hover:shadow-2 hover:scale-[1.02] active:scale-[0.99]"
              >
                Reserve <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/services"
                className="text-sm uppercase tracking-[0.22em] underline-offset-4 hover:underline"
              >
                See the full menu
              </Link>
            </div>
            <div className="mt-12 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex gap-0.5 text-accent">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <span className="uppercase tracking-[0.2em]">Loved by 1,200+ locals</span>
            </div>
          </div>
          <div className="md:col-span-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-surface">
              <img
                src={heroImg}
                alt="Marble nail salon workstation with a curated selection of polishes"
                className="h-full w-full object-cover"
                width={1536}
                height={1024}
                fetchPriority="high"
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent" />
              <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-card/90 px-5 py-4 backdrop-blur-md">
                <p className="font-display text-lg italic">Curated by hand.</p>
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  120+ shades on the wall
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee strip */}
      <div className="border-y border-border/60 bg-surface/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-3 px-6 py-5 text-[11px] uppercase tracking-[0.3em] text-muted-foreground sm:px-10">
          <span>· Walk-ins welcome</span>
          <span>· Sterile tools</span>
          <span>· OPI · DND · Gelish</span>
          <Link to="/gift-cards" className="hover:text-foreground">
            · Gift cards
          </Link>
          <Link to="/gift-cards" className="hover:text-foreground">
            · Parties of 4+
          </Link>
        </div>
      </div>

      {/* STORY */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:px-10 sm:py-32">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="text-[11px] uppercase tracking-[0.3em] text-accent">Our studio</p>
            <h2 className="mt-4 font-display text-5xl leading-[0.95] sm:text-6xl">
              A slower
              <br />
              kind of beauty.
            </h2>
          </div>
          <div className="md:col-span-7 md:pt-6">
            <p className="text-lg leading-relaxed text-foreground/80">
              A studio for precision manicures, pedicures, acrylic sculpture, and modern nail art.
              No upsells. No rushed corners. Just the right tool, the right colour, and an hour to
              yourself.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-8">
              <div>
                <p className="font-display text-4xl">9</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Years open
                </p>
              </div>
              <div>
                <p className="font-display text-4xl">{staff.length || 4}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Resident artists
                </p>
              </div>
              <div>
                <p className="font-display text-4xl">120+</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Shades on the wall
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section id="services" className="bg-card">
        <WaveDivider className="text-card" />
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 sm:py-32">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-accent">The menu</p>
              <h2 className="mt-4 font-display text-5xl sm:text-6xl">Selected services.</h2>
            </div>
            <Link
              to="/services"
              className="hidden text-xs uppercase tracking-[0.25em] underline-offset-4 hover:underline sm:inline"
            >
              Full menu →
            </Link>
          </div>

          {/* Group services by category */}
          {(() => {
            const grouped = new Map<string, typeof services>();
            for (const s of services) {
              const cat = s.category || "Other";
              if (!grouped.has(cat)) grouped.set(cat, []);
              grouped.get(cat)!.push(s);
            }
            return Array.from(grouped.entries());
          })().map(([category, items]) => (
            <div key={category} className="mt-10 first:mt-0">
              <h3 className="font-display mb-4 text-2xl">{category}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((service) => (
                  <div
                    key={service.id}
                    className="group rounded-xl bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{service.name}</h4>
                        {service.description && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {service.description}
                          </p>
                        )}
                        {service.duration_minutes && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            ~{service.duration_minutes} min
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 font-semibold">
                        ${Number(service.price).toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-8 flex justify-center sm:hidden">
            <Link
              to="/services"
              className="text-xs uppercase tracking-[0.25em] underline-offset-4 underline"
            >
              See the full menu →
            </Link>
          </div>
        </div>
        <WaveDivider className="text-card" flip />
      </section>

      {/* MEET THE ARTISTS */}
      <section id="artists" className="mx-auto max-w-7xl px-6 py-24 sm:px-10 sm:py-32">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-accent">Meet the studio</p>
            <h2 className="mt-4 font-display text-5xl sm:text-6xl">The artists.</h2>
          </div>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {staffLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <article key={i} className="rounded-3xl bg-surface overflow-hidden flex flex-col">
                  <Skeleton className="aspect-[4/5] w-full rounded-none" />
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </article>
              ))}
            </>
          ) : (
            staff.map((s: Staff) => {
              const wh = s.working_hours as Record<
                string,
                { open: string; close: string } | undefined
              >;
              const openDays = DAYS.map(([, k]) => k).filter((k) => wh?.[k]);
              return (
                <article
                  key={s.id}
                  className="group rounded-3xl bg-surface overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-[4/5] bg-muted overflow-hidden">
                    <div
                      className="h-full w-full grid place-items-center text-5xl font-display text-white"
                      style={{ background: s.avatar_color || "#7a3b52" }}
                    >
                      {s.name?.[0]}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="font-display text-2xl">{s.name}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-accent">
                      {s.title}
                    </p>
                    {s.bio && (
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.bio}</p>
                    )}
                    {Array.isArray(s.specialties) && s.specialties.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {s.specialties.map((sp: string) => (
                          <span
                            key={sp}
                            className="rounded-full bg-card px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground"
                          >
                            {sp}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                      {openDays.map((k) => DAY_SHORT[k]).join(" · ") || "By appointment"}
                    </div>
                    <Link
                      to="/book"
                      search={{ staff: s.id }}
                      className="mt-6 inline-flex tap-target items-center justify-center gap-2 rounded-lg bg-primary h-11 px-5 text-sm font-medium tracking-[0.01em] text-primary-foreground shadow-1 transition duration-150 hover:shadow-2 hover:scale-[1.02] active:scale-[0.99]"
                    >
                      Book with {s.name.split(" ")[0]}
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* GALLERY PREVIEW */}
      <section id="gallery" className="border-t border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 sm:py-32">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-accent">From the studio</p>
              <h2 className="mt-4 font-display text-5xl sm:text-6xl">Recent work.</h2>
            </div>
            <a
              href={getSalonSocial().instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] underline-offset-4 hover:underline"
            >
              <Instagram className="h-4 w-4" /> Follow
            </a>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-4 sm:gap-6">
            {[
              [g1, "Chrome ombre"],
              [art1, "Pink french with gold"],
              [art2, "Sheer rose gel"],
              [art3, "Glossy burgundy almond"],
            ].map(([src, alt], i) => (
              <figure
                key={i}
                className="group relative aspect-square overflow-hidden rounded-3xl bg-surface transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <img
                  src={src as string}
                  alt={alt as string}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-[400ms] group-hover:scale-105"
                />
              </figure>
            ))}
          </div>
          <div className="mt-8">
            <Link
              to="/gallery"
              className="text-xs uppercase tracking-[0.25em] underline-offset-4 underline"
            >
              See the gallery →
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="border-y border-border bg-background">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <Ornament className="mx-auto h-3 w-32 text-accent" />
          <blockquote className="mt-8 font-display text-4xl italic leading-tight sm:text-5xl">
            "Easily the most calming hour of my week. They treat your hands like a small piece of
            art."
          </blockquote>
          <p className="mt-8 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            — Maya R., regular since 2021
          </p>
        </div>
      </section>

      {/* VISIT + HOURS */}
      <section id="visit" className="bg-card">
        <WaveDivider className="text-card" />
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 sm:py-32">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-surface overflow-hidden flex flex-col">
              <div className="aspect-[5/4] w-full bg-muted">
                <MapEmbed />
              </div>
              <div className="p-8 sm:p-10">
                <p className="text-[11px] uppercase tracking-[0.3em] text-accent">Visit</p>
                <h3 className="mt-3 font-display text-3xl">Find the studio.</h3>
                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span className="text-muted-foreground">
                      {getSalonAddress() || getSalonSocial().mapsUrl}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <a
                      href={`tel:${getSalonPhoneHref()}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {getSalonPhone()}
                    </a>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <a
                      href={`mailto:${getSalonSocial().email}`}
                      className="text-muted-foreground hover:text-foreground break-all"
                    >
                      {getSalonSocial().email}
                    </a>
                  </div>
                </div>
                <a
                  href={getSalonSocial().mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] underline-offset-4 hover:underline"
                >
                  Open in Maps <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="rounded-3xl bg-surface p-8 sm:p-10">
              <p className="text-[11px] uppercase tracking-[0.3em] text-accent">Hours</p>
              <h3 className="mt-4 flex items-center gap-3 font-display text-4xl">
                When we're open <Clock className="h-6 w-6 text-accent" />
              </h3>
              <ul className="mt-8 space-y-2.5 text-sm">
                {(() => {
                  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
                  return DAYS.map(([label, key]) => {
                    const h = asBusinessHours(salon?.business_hours)[key];
                    const isToday = label === todayName;
                    return (
                      <li
                        key={key}
                        className={`flex items-baseline justify-between border-b border-dashed border-border/70 pb-2.5 ${isToday ? "bg-secondary/50 -mx-3 rounded-md px-3" : ""}`}
                      >
                        <span className="font-display text-lg">
                          {label}
                          {isToday && (
                            <span className="text-accent ml-1.5 text-sm font-mono">· today</span>
                          )}
                        </span>
                        <span className="font-mono text-xs tracking-wider text-muted-foreground">
                          {h ? `${h.open} — ${h.close}` : "Closed"}
                        </span>
                      </li>
                    );
                  });
                })()}
              </ul>
              <div className="mt-8 flex flex-wrap gap-2">
                <a
                  href={getSalonSocial().yelp}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-border bg-card px-4 py-2 text-[10px] uppercase tracking-[0.2em] hover:bg-surface"
                >
                  Yelp
                </a>
                <a
                  href={getSalonSocial().instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-border bg-card px-4 py-2 text-[10px] uppercase tracking-[0.2em] hover:bg-surface"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
        <WaveDivider className="text-card" flip />
      </section>

      {/* CTA BAND */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20">
          <BookingCTA variant="primary" />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
