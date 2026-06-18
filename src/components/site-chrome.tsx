import { Link } from "@tanstack/react-router";
import { BUSINESS } from "@/lib/salon";
import { Instagram, Facebook } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
        <Link to="/" className="font-display text-2xl italic tracking-tight">
          Nail Lounge
        </Link>
        <nav className="hidden items-center gap-10 text-xs uppercase tracking-[0.22em] text-muted-foreground md:flex">
          <Link
            to="/services"
            className="hover:text-foreground transition"
            activeProps={{ className: "text-foreground" }}
          >
            Services
          </Link>
          <Link
            to="/gallery"
            className="hover:text-foreground transition"
            activeProps={{ className: "text-foreground" }}
          >
            Gallery
          </Link>
          <Link
            to="/gift-cards"
            className="hover:text-foreground transition"
            activeProps={{ className: "text-foreground" }}
          >
            Gift Cards
          </Link>
          <Link to="/" hash="visit" className="hover:text-foreground transition">
            Visit Us
          </Link>
          <Link to="/appointments" className="hover:text-foreground transition">
            My Visits
          </Link>
        </nav>
        <Link
          to="/book"
          className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground hover:opacity-90 transition"
        >
          Reserve
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-4 sm:px-10">
        <div className="sm:col-span-2">
          <p className="font-display text-2xl italic">Nail Lounge</p>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            A quiet studio for precision manicures, pedicures, and considered nail art in Machesney
            Park, IL.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">{BUSINESS.address}</p>
          <p className="text-xs text-muted-foreground">
            <a href={`tel:${BUSINESS.phoneHref}`} className="hover:text-foreground">
              {BUSINESS.phone}
            </a>{" "}
            ·{" "}
            <a href={`mailto:${BUSINESS.email}`} className="hover:text-foreground">
              {BUSINESS.email}
            </a>
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Visit</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/services" className="hover:underline">
                Services
              </Link>
            </li>
            <li>
              <Link to="/gallery" className="hover:underline">
                Gallery
              </Link>
            </li>
            <li>
              <Link to="/gift-cards" className="hover:underline">
                Gift cards & parties
              </Link>
            </li>
            <li>
              <Link to="/appointments" className="hover:underline">
                My visits
              </Link>
            </li>
            <li>
              <Link to="/book" className="hover:underline">
                Book
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Follow</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                href={BUSINESS.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:underline"
              >
                <Instagram className="h-3.5 w-3.5" /> Instagram
              </a>
            </li>
            <li>
              <a
                href={BUSINESS.tiktok}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                TikTok
              </a>
            </li>
            <li>
              <a
                href={BUSINESS.facebook}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:underline"
              >
                <Facebook className="h-3.5 w-3.5" /> Facebook
              </a>
            </li>
            <li>
              <a href={BUSINESS.yelp} target="_blank" rel="noreferrer" className="hover:underline">
                Yelp
              </a>
            </li>
            <li>
              <a
                href={BUSINESS.booksy}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                Booksy
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-[11px] uppercase tracking-[0.3em] text-muted-foreground sm:px-10">
          © {new Date().getFullYear()} Nail Lounge · Machesney Park, IL
        </div>
      </div>
    </footer>
  );
}

export function MapEmbed({ className = "" }: { className?: string }) {
  return (
    <iframe
      title="Nail Lounge location"
      src={BUSINESS.mapEmbed}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={"h-full w-full border-0 " + className}
      allowFullScreen
    />
  );
}
