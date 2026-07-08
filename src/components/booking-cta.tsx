import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

type Variant = "primary" | "secondary" | "simple";

const framings: Record<Variant, { eyebrow?: string; heading: string; body: string; cta: string }> =
  {
    primary: {
      eyebrow: "Ready when you are",
      heading: "Book your moment.",
      body: "Chairs fill up on weekends — reserve yours in about a minute.",
      cta: "Book an appointment",
    },
    secondary: {
      eyebrow: "The next step",
      heading: "Find a time that suits you.",
      body: "Pick a service, a stylist, and a slot. No account, no fuss.",
      cta: "Start booking",
    },
    simple: {
      heading: "Have something in mind?",
      body: "Tell us what you're after and we'll match you with the right stylist.",
      cta: "Reserve your spot",
    },
  };

export function BookingCTA({
  variant = "primary",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const f = framings[variant];

  if (variant === "simple") {
    return (
      <Link
        to="/book"
        className={`text-sm font-medium underline-offset-4 hover:underline ${className}`}
      >
        {f.cta} →
      </Link>
    );
  }

  return (
    <section
      className={`relative overflow-hidden rounded-xl px-6 py-12 text-center sm:px-12 ${className}`}
      style={
        variant === "primary"
          ? { background: "var(--primary)", color: "var(--primary-foreground)" }
          : { background: "var(--surface)" }
      }
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/12 to-transparent" />
      {f.eyebrow && (
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] opacity-70">
          {f.eyebrow}
        </p>
      )}
      <h2 className="mt-2 font-display text-3xl sm:text-4xl">{f.heading}</h2>
      <p className="mx-auto mt-3 max-w-md text-base opacity-80">{f.body}</p>
      <div className="mt-6 flex justify-center">
        <Link
          to="/book"
          className={`inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-medium transition-all ${
            variant === "primary"
              ? "bg-white text-primary hover:bg-white/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {f.cta} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
