import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { BUSINESS } from "@/lib/salon";
import { Gift, Users, Sparkles, Phone, Mail, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/gift-cards")({
  head: () => ({
    meta: [
      { title: "Gift Cards & Parties — Nail Lounge, Machesney Park IL" },
      { name: "description", content: "Treat someone with a Nail Lounge gift card, or book a bridal, birthday, or girls' day party for 4 or more. Bookings in Machesney Park, IL." },
      { property: "og:title", content: "Gift Cards & Parties — Nail Lounge" },
      { property: "og:description", content: "Gift cards and private salon parties at Nail Lounge — bridal, birthdays, bachelorettes, mother-daughter days." },
      { property: "og:url", content: "/gift-cards" },
    ],
    links: [{ rel: "canonical", href: "/gift-cards" }],
  }),
  component: GiftCardsPage,
});

const AMOUNTS = [25, 50, 75, 100, 150, 200];

const OCCASIONS = [
  { title: "Bridal & bachelorette", body: "A private 2-hour window for the bride and her party — matching sets, mimosas welcome." },
  { title: "Birthdays", body: "Reserve a corner of the studio for 4–8 guests. Group polish change or full mani-pedi." },
  { title: "Mother–daughter day", body: "Two seats side-by-side. Bring a book; we'll bring the tea." },
  { title: "Corporate & client gifts", body: "Bulk gift cards with a custom note, hand-delivered or emailed." },
];

function GiftCardsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-28">
          <p className="text-[11px] uppercase tracking-[0.35em] text-accent">Gift cards & parties</p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[0.95] tracking-[-0.01em] sm:text-7xl">
            The easiest <span className="italic">good gift.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground">
            Give an hour of quiet, careful work — or reserve the studio for a small group. We host parties of 4 or more by appointment.
          </p>
        </div>
      </section>

      {/* GIFT CARDS */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-28">
        <div className="grid gap-10 md:grid-cols-12">
          <header className="md:col-span-4">
            <Gift className="h-6 w-6 text-accent" />
            <h2 className="mt-4 font-display text-3xl sm:text-4xl">Gift cards</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Available in-studio or by phone. Mailed in a hand-tied envelope or sent digitally with a personal note.
            </p>
          </header>

          <div className="md:col-span-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {AMOUNTS.map((a) => (
                <div key={a} className="rounded-2xl bg-surface p-6 text-center">
                  <p className="font-display text-4xl">${a}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Gift card</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Custom amounts available. Cards never expire and can be used toward any service.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`tel:${BUSINESS.phoneHref}`}
                className="inline-flex tap-target items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground hover:opacity-90 transition"
              >
                <Phone className="h-3.5 w-3.5" /> Call to purchase
              </a>
              <a
                href={`mailto:${BUSINESS.email}?subject=Gift%20card%20request`}
                className="inline-flex tap-target items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-xs font-medium uppercase tracking-[0.18em] hover:bg-surface transition"
              >
                <Mail className="h-3.5 w-3.5" /> Email us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PARTIES */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-28">
          <div className="flex items-end justify-between">
            <div>
              <Users className="h-6 w-6 text-accent" />
              <p className="mt-4 text-[11px] uppercase tracking-[0.3em] text-accent">Private parties</p>
              <h2 className="mt-3 font-display text-4xl sm:text-5xl">For 4 or more.</h2>
            </div>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {OCCASIONS.map((o) => (
              <article key={o.title} className="rounded-3xl bg-card p-8">
                <Sparkles className="h-5 w-5 text-accent" />
                <h3 className="mt-4 font-display text-2xl">{o.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{o.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-3xl bg-card p-8 sm:p-10">
            <h3 className="font-display text-2xl sm:text-3xl">How it works</h3>
            <ol className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li><span className="font-mono text-foreground">01</span> &nbsp; Call or email with your date, group size, and what you have in mind.</li>
              <li><span className="font-mono text-foreground">02</span> &nbsp; We'll hold the studio, assign artists, and share a quote.</li>
              <li><span className="font-mono text-foreground">03</span> &nbsp; A small deposit confirms the booking.</li>
              <li><span className="font-mono text-foreground">04</span> &nbsp; Arrive 10 minutes early — bring snacks, music, or champagne.</li>
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`mailto:${BUSINESS.email}?subject=Private%20party%20request`}
                className="inline-flex tap-target items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground hover:opacity-90 transition"
              >
                Request a party
              </a>
              <Link
                to="/book"
                className="inline-flex tap-target items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-xs font-medium uppercase tracking-[0.18em] hover:bg-surface transition"
              >
                Or book individually <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
