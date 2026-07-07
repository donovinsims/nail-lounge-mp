import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { lookupAppointments, cancelPublicBooking } from "@/lib/booking.functions";
import { fmtDate, fmtTime, fmtMoney } from "@/lib/salon";
import { getSalonId, getSalonName } from "@/lib/env";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/appointments")({
  head: () => ({ meta: [{ title: `My appointments — ${getSalonName()}` }] }),
  component: Appointments,
});

function Appointments() {
  const [phone, setPhone] = useState("");
  const lookup = useServerFn(lookupAppointments);
  const cancel = useServerFn(cancelPublicBooking);
  const lookupMutation = useMutation({ mutationFn: lookup });
  const cancelMutation = useMutation({
    mutationFn: cancel,
    onSuccess: () => {
      toast.success("Cancelled");
      lookupMutation.mutate({ data: { phone } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background px-5 py-6 safe-pt">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">My appointments</h1>
      <p className="mt-2 text-sm text-muted-foreground">Enter the phone number you booked with.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookupMutation.mutate({ data: { phone, salonId: getSalonId()! } });
        }}
        className="mt-6 flex gap-2"
      >
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          placeholder="(815) 555-0123"
          className="flex-1 tap-target rounded-xl bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          className="tap-target rounded-xl bg-primary px-5 font-medium text-primary-foreground"
          disabled={lookupMutation.isPending}
        >
          {lookupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find"}
        </button>
      </form>

      <div className="mt-8 space-y-3">
        {lookupMutation.isPending && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-surface p-4 animate-pulse">
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
                <div className="mt-3 h-3 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        )}
        {!lookupMutation.isPending && lookupMutation.data?.length === 0 && (
          <p className="pt-4 text-sm text-muted-foreground">No appointments found.</p>
        )}
        {!lookupMutation.isPending &&
          lookupMutation.data?.map((b) => (
            <li key={b.id} className="rounded-2xl bg-surface p-4">
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{b.services?.name}</p>
                  <p className="text-xs text-muted-foreground">with {b.staff?.name}</p>
                </div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full ${b.status === "cancelled" ? "bg-destructive/10 text-destructive" : b.status === "completed" ? "bg-success/10 text-success" : "bg-surface-2"}`}
                >
                  {b.status}
                </span>
              </div>
              <p className="mt-2 text-sm">
                {fmtDate(b.start_time)} · {fmtTime(b.start_time)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {fmtMoney(Number(b.services?.price ?? 0))}
              </p>
              {b.status === "confirmed" && (
                <button
                  onClick={() => {
                    if (window.confirm("Cancel this appointment?")) {
                      cancelMutation.mutate({ data: { bookingId: b.id, phone } });
                    }
                  }}
                  className="mt-3 text-sm font-medium text-destructive underline-offset-4 hover:underline"
                >
                  Cancel appointment
                </button>
              )}
            </li>
          ))}
      </div>
    </div>
  );
}
