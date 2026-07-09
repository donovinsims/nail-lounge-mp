import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef } from "react";
import { lookupAppointments, cancelPublicBooking } from "@/lib/booking.functions";
import { fmtDate, fmtTime, fmtMoney } from "@/lib/utils";
import { getSalonId, getSalonName } from "@/lib/env";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/appointments")({
  validateSearch: (search: Record<string, unknown>) => ({
    phone: typeof search.phone === "string" ? search.phone : undefined,
  }),
  head: () => ({ meta: [{ title: `My appointments — ${getSalonName()}` }] }),
  component: Appointments,
});

type BookingLookup = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  services: { name: string; price: number } | null;
  staff: { name: string } | null;
};

function Appointments() {
  const navigate = useNavigate();
  const { phone: phoneParam } = Route.useSearch();
  const [phone, setPhone] = useState(phoneParam ?? "");
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
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

  // Auto-trigger lookup when phone is provided via search param (mount-only)
  const autoTriggered = useRef(false);
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (phoneParam && !autoTriggered.current) {
      autoTriggered.current = true;
      lookupMutation.mutate({ data: { phone: phoneParam, salonId: getSalonId()! } });
    }
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Update URL search param when phone changes
  useEffect(() => {
    if (phone && phone !== phoneParam) {
      navigate({ to: "/appointments", search: { phone }, replace: true });
    } else if (!phone && phoneParam) {
      navigate({ to: "/appointments", search: { phone: undefined }, replace: true });
    }
  }, [phone, navigate, phoneParam]);

  return (
    <main id="main-content" className="min-h-screen bg-background px-5 py-6 safe-pt">
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
          className="flex-1 tap-target rounded-xl bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <Button className="tap-target" disabled={lookupMutation.isPending}>
          {lookupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find"}
        </Button>
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
          <p className="pt-4 text-sm text-muted-foreground">
            No appointments found. Double-check the phone number you used to book, or call the salon
            for help.
          </p>
        )}
        {!lookupMutation.isPending && lookupMutation.data && (
          <ul className="space-y-3">
            {lookupMutation.data.map((b: BookingLookup) => (
              <li key={b.id} className="rounded-2xl bg-surface p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{b.services?.name}</p>
                    <p className="text-xs text-muted-foreground">with {b.staff?.name}</p>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full ${b.status === "cancelled" ? "bg-destructive/15 text-destructive-ink" : b.status === "completed" ? "bg-success/15 text-success-ink" : "bg-surface-2"}`}
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
                  <AlertDialog
                    open={cancelTarget === b.id}
                    onOpenChange={(open) => setCancelTarget(open ? b.id : null)}
                  >
                    <AlertDialogTrigger asChild>
                      <button className="mt-3 text-sm font-medium text-destructive underline-offset-4 hover:underline">
                        Cancel appointment
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <TriangleAlert className="h-5 w-5 text-destructive" />
                          Cancel this appointment?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will cancel your {b.services?.name} appointment with {b.staff?.name}{" "}
                          on {fmtDate(b.start_time)} at {fmtTime(b.start_time)}. This action cannot
                          be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep it</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            cancelMutation.mutate({
                              data: { bookingId: b.id, phone, salonId: getSalonId()! },
                            });
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, cancel
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
