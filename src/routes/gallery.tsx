import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { InstagramEmbed, TikTokEmbed } from "@/components/social-embeds";
import { getSalonName, getSalonSocial } from "@/lib/env";
import { Instagram, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import art1 from "@/assets/art1.jpg";
import art2 from "@/assets/art2.jpg";
import art3 from "@/assets/art3.jpg";
import g1 from "@/assets/gallery1.jpg";
import g2 from "@/assets/gallery2.jpg";
import g3 from "@/assets/gallery3.jpg";
import g4 from "@/assets/gallery4.jpg";

const PIECES = [
  {
    src: g1,
    alt: "Chrome ombre nails with soft gold flake",
    caption: "Chrome ombre nails with soft gold flake",
  },
  {
    src: art1,
    alt: "Soft pink french with gold floral detail",
    caption: "Soft pink french with gold floral detail",
  },
  {
    src: g3,
    alt: "Floral nail art with rhinestone accents on coffin shape",
    caption: "Floral nail art with rhinestone accents on coffin shape",
  },
  { src: art2, alt: "Sheer rose gel on natural nails", caption: "Sheer rose gel on natural nails" },
  { src: g2, alt: "Delicate almond french tip", caption: "Delicate almond french tip" },
  { src: art3, alt: "Glossy burgundy almond", caption: "Glossy burgundy almond" },
  {
    src: g4,
    alt: "Red gel pedicure in a spa setting",
    caption: "Red gel pedicure in a spa setting",
  },
];

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: `Gallery — ${getSalonName()}` },
      {
        name: "description",
        content: `Recent work from the ${getSalonName()} studio — gel, acrylic, chrome, ombre, french, and custom nail art.`,
      },
      { property: "og:title", content: `Gallery — ${getSalonName()}` },
      {
        property: "og:description",
        content: "Curated nail art and pedicure work from our resident artists.",
      },
      { property: "og:image", content: g3 },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const show = (i: number) => setActiveIndex(i);
  const close = () => setActiveIndex(null);
  const step = (dir: number) =>
    setActiveIndex((cur) => (cur === null ? cur : (cur + dir + PIECES.length) % PIECES.length));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-28">
          <p className="text-xs uppercase tracking-[0.35em] text-accent">Gallery</p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[0.95] tracking-[-0.01em] sm:text-7xl">
            Recent <span className="italic">work.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground">
            Hand-finished sets and pedicures from our resident artists. Bring a screenshot or
            describe what you'd love — we'll make it.
          </p>
          <div className="mt-8 flex gap-4">
            <a
              href={getSalonSocial().instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] underline-offset-4 hover:underline"
            >
              <Instagram className="h-4 w-4" /> Instagram
            </a>
            <a
              href={getSalonSocial().tiktok}
              target="_blank"
              rel="noreferrer"
              className="text-xs uppercase tracking-[0.25em] underline-offset-4 hover:underline"
            >
              TikTok
            </a>
            <a
              href={getSalonSocial().tiktok}
              target="_blank"
              rel="noreferrer"
              className="text-xs uppercase tracking-[0.25em] underline-offset-4 hover:underline"
            >
              TikTok
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-24">
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {PIECES.map((p, i) => (
            <button
              key={i}
              onClick={() => show(i)}
              className="group relative block w-full overflow-hidden rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 cursor-pointer"
            >
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <p className="text-sm text-white">{p.caption}</p>
              </div>
            </button>
          ))}
        </div>

        <Dialog open={activeIndex !== null} onOpenChange={(o) => !o && close()}>
          <DialogContent className="max-w-3xl overflow-hidden border-0 bg-transparent p-0 shadow-none">
            {activeIndex !== null && PIECES[activeIndex] && (
              <figure className="relative">
                <DialogTitle className="sr-only">{PIECES[activeIndex].caption}</DialogTitle>
                <img
                  src={PIECES[activeIndex].src}
                  alt={PIECES[activeIndex].alt}
                  className="max-h-[80vh] w-full rounded-xl object-contain"
                />
                <figcaption className="absolute inset-x-0 bottom-0 rounded-b-xl bg-gradient-to-t from-black/70 to-transparent p-4 text-center text-sm text-white">
                  {PIECES[activeIndex].caption}
                </figcaption>
                <button
                  onClick={() => step(-1)}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/50 cursor-pointer active:scale-[0.96]"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => step(1)}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/50 cursor-pointer active:scale-[0.96]"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </figure>
            )}
          </DialogContent>
        </Dialog>

        <section className="mt-24">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent">Follow along</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl">Live from the studio.</h2>
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <InstagramEmbed />
            <TikTokEmbed />
          </div>
        </section>

        <div className="mt-20 rounded-3xl bg-surface p-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Inspired?</p>
          <h3 className="mt-4 font-display text-3xl sm:text-4xl">
            Bring the look. We'll bring the hands.
          </h3>
          <Link
            to="/book"
            className="mt-8 inline-flex tap-target items-center gap-3 rounded-lg bg-primary h-12 px-7 text-sm font-medium tracking-[0.01em] text-primary-foreground shadow-1 transition duration-150 hover:shadow-2 hover:scale-[1.02] active:scale-[0.99]"
          >
            Reserve <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
