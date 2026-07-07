import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle } from "lucide-react";

export const Route = createFileRoute("/booking-confirmed")({
  component: BookingConfirmed,
});

function BookingConfirmed() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 text-center shadow-lg space-y-5">
        <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
        <h1 className="text-xl font-semibold">You're all set!</h1>
        <p className="text-sm text-muted-foreground">
          Your appointment is confirmed. See you soon!
        </p>
        <Link
          to="/"
          className="inline-block mt-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
