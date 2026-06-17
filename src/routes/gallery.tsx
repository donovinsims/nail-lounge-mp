import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { InstagramEmbed, TikTokEmbed } from "@/components/social-embeds";
import { BUSINESS } from "@/lib/salon";
import { Instagram, ArrowRight } from "lucide-react";
import art1 from "@/assets/art1.jpg";
import art2 from "@/assets/art2.jpg";
import art3 from "@/assets/art3.jpg";
import g1 from "@/assets/gallery1.jpg";
import g2 from "@/assets/gallery2.jpg";
import g3 from "@/assets/gallery3.jpg";
import g4 from "@/assets/gallery4.jpg";

const PIECES = [
  { src: g1, alt: "Chrome ombre nails with soft gold flake" },
  { src: art1, alt: "Soft pink french with gold floral detail" },
  { src: g3, alt: "Floral nail art with rhinestone accents on coffin shape" },
  { src: art2, alt: "Sheer rose gel on natural nails" },
  { src: g2, alt: "Delicate almond french tip" },
  { src: art3, alt: "Glossy burgundy almond" },
  { src: g4, alt: "Red gel pedicure in a spa setting" },
];

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Nail Art Gallery — Nail Lounge, Machesney Park IL" },
      { name: "description", content: "Recent work from the Nail Lounge studio — gel, acrylic, chrome, ombre, french, and custom nail art." },
      { property: "og:title", content: "Nail Art Gallery — Nail Lounge" },
      { property: "og:description", content: "Curated nail art and pedicure work from our resident artists." },
      { property: "og:image", content: g3 },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-28">
          <p className="text-[11px] uppercase tracking-[0.35em] text-accent">Gallery</p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[0.95] tracking-[-0.01em] sm:text-7xl">
            Recent <span className="italic">work.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground">
            Hand-finished sets and pedicures from our resident artists. Bring a screenshot or describe what you'd love — we'll make it.
          </p>
          <div className="mt-8 flex gap-4">
            <a
              href={BUSINESS.instagram}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] underline-offset-4 hover:underline"
            >
              <Instagram className="h-4 w-4" /> @nailloungemachesneypark
            </a>
            <a
              href={BUSINESS.tiktok}
              target="_blank" rel="noreferrer"
              className="text-xs uppercase tracking-[0.25em] underline-offset-4 hover:underline"
            >
              TikTok
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-24">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6">
          {PIECES.map((p, i) => (
            <figure
              key={i}
              className={`group relative overflow-hidden rounded-2xl bg-surface sm:rounded-3xl ${i % 5 === 0 ? "row-span-2 aspect-[3/5]" : "aspect-square"}`}
            >
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            </figure>
          ))}
        </div>

        <section className="mt-24">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-accent">Follow along</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl">Live from the studio.</h2>
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <InstagramEmbed />
            <TikTokEmbed />
          </div>
        </section>


        <div className="mt-20 rounded-3xl bg-surface p-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-accent">Inspired?</p>
          <h3 className="mt-4 font-display text-3xl sm:text-4xl">Bring the look. We'll bring the hands.</h3>
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
