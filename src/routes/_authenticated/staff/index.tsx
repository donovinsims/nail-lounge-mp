import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyStaff } from "@/lib/admin.functions";
import { getPendingCompletions, completeStaffModal } from "@/lib/booking.functions";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/staff/")({
  component: StaffDashboard,
});

interface PendingBooking {
  id: string;
  start_time: string;
  services: { name: string };
  clients: { name: string };
}

function StaffDashboard() {
  const [pending, setPending] = useState<PendingBooking[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [tipAmount, setTipAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "Credit/Debit" | "Cash" | "Venmo" | "Cash App"
  >("Cash");
  const [serviceNotes, setServiceNotes] = useState("");

  useEffect(() => {
    getMyStaff()
      .then((staff) => {
        if (staff) {
          setStaffId(staff.id);
          return getPendingCompletions({ data: { staffId: staff.id } });
        }
        return [];
      })
      .then((bookings) => {
        const pendingList = bookings as PendingBooking[];
        setPending(pendingList);
        if (pendingList.length > 0) {
          setShowModal(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const currentBooking = pending[currentIndex];

  const handleSubmit = useCallback(async () => {
    if (!currentBooking) return;
    setSubmitting(true);
    try {
      await completeStaffModal({
        data: {
          bookingId: currentBooking.id,
          tipAmount,
          paymentMethod,
          serviceNotes,
        },
      });

      // Reset form
      setTipAmount(0);
      setPaymentMethod("Cash");
      setServiceNotes("");

      // Move to next pending booking
      const nextIndex = currentIndex + 1;
      if (nextIndex < pending.length) {
        setCurrentIndex(nextIndex);
      } else {
        // No more pending bookings — dismiss modal
        setShowModal(false);
        setPending([]);
      }
    } catch (err) {
      console.error("Failed to complete booking:", err);
    } finally {
      setSubmitting(false);
    }
  }, [currentBooking, tipAmount, paymentMethod, serviceNotes, currentIndex, pending.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* ── Lockout Modal ────────────────────────────────────────────── */}
      {showModal && currentBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Complete Appointment</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Finish this booking to continue using the staff portal.
            </p>

            <div className="mt-4 space-y-1 rounded-xl bg-surface p-3 text-sm">
              <p>
                <span className="font-medium">Client:</span> {currentBooking.clients.name}
              </p>
              <p>
                <span className="font-medium">Service:</span> {currentBooking.services.name}
              </p>
              <p>
                <span className="font-medium">Time:</span>{" "}
                {new Date(currentBooking.start_time).toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {/* Tip Amount */}
              <div>
                <label className="mb-1 block text-sm font-medium">Tip Amount ($)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={tipAmount}
                  onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="mb-1 block text-sm font-medium">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                  className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit/Debit">Credit/Debit</option>
                  <option value="Venmo">Venmo</option>
                  <option value="Cash App">Cash App</option>
                </select>
              </div>

              {/* Service Notes */}
              <div>
                <label className="mb-1 block text-sm font-medium">Service Notes</label>
                <textarea
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="Any notes about the service..."
                  rows={3}
                  className="w-full resize-none rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting
                  ? "Saving..."
                  : `Complete & ${currentIndex < pending.length - 1 ? "Next" : "Finish"}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dashboard Content ────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Staff Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your upcoming appointments and manage completed services.
        </p>

        {!showModal && pending.length === 0 && (
          <div className="mt-8 rounded-xl border bg-card p-8 text-center text-muted-foreground">
            <p>No pending appointments to complete.</p>
          </div>
        )}

        {showModal && currentBooking && (
          <div className="mt-8 rounded-xl border bg-card p-8 text-center text-muted-foreground">
            <p>Complete the appointment above to continue.</p>
          </div>
        )}
      </div>
    </>
  );
}
