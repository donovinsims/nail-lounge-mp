import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle } from "lucide-react";
import { z } from "zod";
import { getBookingDetails } from "@/lib/booking.functions";
import { getSalonName } from "@/lib/env";
import { fmtDate, fmtTime, fmtMoney } from "@/lib/utils";

const searchSchema = z.object({
  bookingId: z.string().uuid(),
});

export const Route = createFileRoute("/booking-confirmed")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: `Booking Confirmed — ${getSalonName()}` },
      { name: "description", content: "Your appointment is confirmed." },
    ],
  }),
  component: BookingConfirmed,
});

function BookingConfirmed() {
  const { bookingId } = Route.useSearch();
  const fetchDetails = useServerFn(getBookingDetails);

  const { data, isPending, isError } = useQuery({
    queryKey: ["booking-details", bookingId],
    queryFn: () => fetchDetails({ bookingId } as { bookingId: string }),
    staleTime: 60_000,
  });

  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading your booking details...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-surface p-8 text-center shadow-lg space-y-5">
          <h1 className="text-xl font-semibold text-destructive">Booking Not Found</h1>
          <p className="text-sm text-muted-foreground">
            We couldn't find your booking details. Please check your confirmation SMS.
          </p>
          <Link
            to="/"
            className="inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const start = new Date(data.startTime);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Success Header */}
        <div className="rounded-2xl bg-surface p-8 text-center shadow-lg space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <h1 className="font-display text-2xl tracking-tight">You're all set!</h1>
            <p className="text-sm text-muted-foreground">
              Your appointment at {getSalonName()} is confirmed.
            </p>
          </div>
        </div>

        {/* Booking Summary Card */}
        <div className="rounded-2xl bg-surface p-6 shadow-lg space-y-4">
          <h2 className="font-display text-lg">Appointment Details</h2>

          <div className="space-y-3">
            <DetailRow label="Service" value={data.serviceName} />
            <DetailRow label="Date" value={fmtDate(start)} />
            <DetailRow label="Time" value={fmtTime(start)} />
            <DetailRow label="Staff Member" value={data.staffName} />
            {data.servicePrice > 0 && (
              <DetailRow label="Price" value={fmtMoney(data.servicePrice)} />
            )}
            <DetailRow label="Name" value={data.clientName} />
          </div>

          <div className="border-t border-border pt-4">
            <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 space-y-1">
              <p className="font-medium">Payment</p>
              <p>
                Pay in-studio at the time of your appointment. We accept credit/debit, cash, Venmo,
                and Cash App.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            to="/"
            className="w-full rounded-xl bg-primary py-3 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
          >
            Back to home
          </Link>
          <Link
            to="/appointments"
            search={{ phone: data.clientPhone } as { phone: string }}
            className="w-full rounded-xl border border-border py-3 text-center text-sm font-medium text-foreground hover:bg-muted transition-all"
          >
            View all my appointments
          </Link>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
