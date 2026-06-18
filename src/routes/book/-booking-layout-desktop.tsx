import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-chrome";
import { SiteFooter } from "@/components/site-chrome";
import BookingStepProgress from "./-booking-step-progress";

interface BookingLayoutDesktopProps {
  step: number;
  onStepClick: (s: number) => void;
  onBack: () => void;
  summary: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}

export default function BookingLayoutDesktop({
  step,
  onStepClick,
  onBack,
  summary,
  children,
  footer,
}: BookingLayoutDesktopProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Back link */}
        {step === 1 ? (
          <Link
            to="/services"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back to services
          </Link>
        ) : (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
        )}

        {/* Page title */}
        <div className="mt-4">
          <h1 className="font-display text-4xl">Book your appointment</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete the steps below to reserve your seat.
          </p>
        </div>

        {/* Step progress */}
        <div className="mt-8">
          <BookingStepProgress step={step} onStepClick={onStepClick} />
        </div>

        {/* Two-column grid */}
        <div className="mt-10 grid grid-cols-12 gap-10">
          {/* Step content (left) */}
          <div className="col-span-7 space-y-8">
            {children}
            {footer && <div className="pt-4">{footer}</div>}
          </div>

          {/* Summary sidebar (right) */}
          <aside className="col-span-5">
            <div className="sticky top-24">{summary}</div>
          </aside>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
