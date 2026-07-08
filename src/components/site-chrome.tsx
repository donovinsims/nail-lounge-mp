import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  getSalonAddress,
  getSalonName,
  getSalonPhone,
  getSalonPhoneHref,
  getSalonSocial,
  getSalonTagline,
} from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Menu, Instagram, Facebook } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
        <Link to="/" className="font-display text-2xl italic tracking-tight">
          {getSalonName()}
        </Link>
        <nav className="hidden items-center gap-10 text-xs uppercase tracking-[0.22em] text-muted-foreground md:flex">
          <Link
            to="/services"
            className="hover:text-foreground transition"
            activeProps={{ className: "text-primary font-medium" }}
          >
            Services
          </Link>
          <Link
            to="/gallery"
            className="hover:text-foreground transition"
            activeProps={{ className: "text-primary font-medium" }}
          >
            Gallery
          </Link>
          <Link
            to="/gift-cards"
            className="hover:text-foreground transition"
            activeProps={{ className: "text-primary font-medium" }}
          >
            Gift Cards
          </Link>
          <Link to="/" hash="visit" className="hover:text-foreground transition">
            Visit Us
          </Link>
          <Link
            to="/appointments"
            search={{ phone: undefined }}
            className="hover:text-foreground transition"
          >
            My Visits
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link to="/book">Reserve</Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="flex size-10 items-center justify-center rounded-lg md:hidden hover:bg-accent/50 transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <div className="flex h-full flex-col">
                <div className="mt-6">
                  <p className="font-display text-xl italic">{getSalonName()}</p>
                </div>
                <nav className="mt-10 flex flex-col gap-6">
                  <SheetClose asChild>
                    <Link
                      to="/services"
                      className="text-sm uppercase tracking-[0.22em] text-muted-foreground transition hover:text-foreground"
                    >
                      Services
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/gallery"
                      className="text-sm uppercase tracking-[0.22em] text-muted-foreground transition hover:text-foreground"
                    >
                      Gallery
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/gift-cards"
                      className="text-sm uppercase tracking-[0.22em] text-muted-foreground transition hover:text-foreground"
                    >
                      Gift Cards
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/"
                      hash="visit"
                      className="text-sm uppercase tracking-[0.22em] text-muted-foreground transition hover:text-foreground"
                    >
                      Visit Us
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/appointments"
                      search={{ phone: undefined }}
                      className="text-sm uppercase tracking-[0.22em] text-muted-foreground transition hover:text-foreground"
                    >
                      My Visits
                    </Link>
                  </SheetClose>
                </nav>
                <div className="mt-auto pb-8">
                  <SheetClose asChild>
                    <Button asChild className="w-full">
                      <Link to="/book">Reserve</Link>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-4 sm:px-10">
        <div className="sm:col-span-2">
          <p className="font-display text-2xl italic">{getSalonName()}</p>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{getSalonTagline()}</p>
          <p className="mt-4 text-xs text-muted-foreground">{getSalonAddress()}</p>
          <p className="text-xs text-muted-foreground">
            <a href={`tel:${getSalonPhoneHref()}`} className="hover:text-foreground">
              {getSalonPhone()}
            </a>{" "}
            ·{" "}
            <a href={`mailto:${getSalonSocial().email}`} className="hover:text-foreground">
              {getSalonSocial().email}
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
              <Link to="/appointments" search={{ phone: undefined }} className="hover:underline">
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
                href={getSalonSocial().instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:underline"
              >
                <Instagram className="h-3.5 w-3.5" /> Instagram
              </a>
            </li>
            <li>
              <a
                href={getSalonSocial().tiktok}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                TikTok
              </a>
            </li>
            <li>
              <a
                href={getSalonSocial().facebook}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:underline"
              >
                <Facebook className="h-3.5 w-3.5" /> Facebook
              </a>
            </li>
            <li>
              <a
                href={getSalonSocial().yelp}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                Yelp
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-6 sm:px-10">
          <div className="flex flex-col items-center gap-2 text-center text-[11px] uppercase tracking-[0.3em] text-muted-foreground sm:flex-row sm:justify-between">
            <span>
              © {new Date().getFullYear()} {getSalonName()}
            </span>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-foreground transition">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-foreground transition">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function MapEmbed({ className = "" }: { className?: string }) {
  return (
    <iframe
      title={`${getSalonName()} location`}
      src={getSalonSocial().mapEmbed}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={"h-full w-full border-0 " + className}
      allowFullScreen
    />
  );
}
