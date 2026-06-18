import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { completeBookingWithPayment } from "@/lib/admin.functions";
import { fmtMoney, fmtTime } from "@/lib/salon";
import { CreditCard, Loader2, Check, User, Scissors } from "lucide-react";
import { toast } from "sonner";

export default function POS({ salonId }: { salonId: string }) {
  const qc = useQueryClient();
  const complete = useServerFn(completeBookingWithPayment);
  const [sel, setSel] = useState<any>(null);
  const [tip, setTip] = useState(0);
  const [tipSplit, setTipSplit] = useState(100);
  const [paying, setPaying] = useState(false);

  const { data: bookings = [] } = useQuery({
    queryKey: ["pos-open", salonId],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, start_time, services(name, price), staff(name), clients(name)")
        .eq("salon_id", salonId)
        .eq("status", "confirmed")
        .order("start_time");
      return data ?? [];
    },
  });

  const checkout = async () => {
    setPaying(true);
    await new Promise((r) => setTimeout(r, 1200));
    try {
      const r: any = await complete({
        data: { bookingId: sel.id, tipAmount: tip, tipToTechPercent: tipSplit },
      });
      toast.success(`Paid. Tech earned ${fmtMoney(r.techShare + r.tipToTech)}`);
      setSel(null);
      setTip(0);
      qc.invalidateQueries();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPaying(false);
    }
  };

  const tipPresetsPct = [0, 10, 15, 18, 20, 25]; // percentage of service price

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
      {/* Open tickets */}
      <div className="rounded-2xl bg-surface">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold">Open tickets</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {bookings.length} ticket{bookings.length !== 1 ? "s" : ""} waiting
          </p>
        </div>
        <ul className="divide-y divide-border">
          {bookings.length === 0 && (
            <li className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-2">
              <Check className="h-8 w-8 text-muted-foreground/40" />
              <span>All caught up — no open tickets.</span>
            </li>
          )}
          {bookings.map((b: any) => {
            const isSelected = sel?.id === b.id;
            return (
              <li key={b.id}>
                <button
                  onClick={() => {
                    setSel(b);
                    setTip(0);
                  }}
                  className={`w-full grid grid-cols-[1fr_auto] items-center gap-3 p-4 text-left transition-colors ${
                    isSelected
                      ? "bg-primary/5 ring-1 ring-primary/20"
                      : "hover:bg-surface-2/50"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {b.clients?.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      <Scissors className="h-3 w-3 shrink-0" />
                      <span>{b.services?.name} · {b.staff?.name}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {fmtTime(b.start_time)}
                    </p>
                  </div>
                  <span className="font-mono text-lg font-semibold tabular-nums">
                    {fmtMoney(Number(b.services?.price))}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Checkout panel */}
      <div className="rounded-2xl bg-surface p-6">
        {!sel ? (
          <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-3">
            <CreditCard className="h-10 w-10 text-muted-foreground/30" />
            <span>Select a ticket to take payment.</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Customer info */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Ticket
              </p>
              <p className="mt-1 text-xl font-semibold">{sel.clients?.name}</p>
              <p className="text-sm text-muted-foreground">
                {sel.services?.name} · {sel.staff?.name}
              </p>
            </div>

            {/* Subtotal */}
            <div className="flex items-baseline justify-between border-b border-border pb-4">
              <span className="text-muted-foreground text-sm">Subtotal</span>
              <span className="font-mono text-xl font-bold">{fmtMoney(Number(sel.services?.price))}</span>
            </div>

            {/* Tip */}
            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2 block">
                Tip
              </label>
              <div className="grid grid-cols-3 gap-2">
                {tipPresetsPct.map((pct) => {
                  const val = Math.round(Number(sel?.services?.price ?? 0) * pct / 100);
                  return (
                    <button
                      key={pct}
                      onClick={() => setTip(val)}
                      className={`tap-target rounded-xl text-sm font-medium transition-all ${
                        tip === val
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-surface-2 hover:bg-surface-2/70 text-foreground"
                      }`}
                    >
                      ${pct === 0 ? "0" : val}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tip split */}
            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2 block">
                Tech commission: {tipSplit}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={10}
                value={tipSplit}
                onChange={(e) => setTipSplit(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Tech: {tipSplit}%</span>
                <span>Salon: {100 - tipSplit}%</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-baseline justify-between pt-2 border-t border-border">
              <span className="font-semibold">Total</span>
              <span className="font-mono text-2xl font-bold">
                {fmtMoney(Number(sel.services?.price) + tip)}
              </span>
            </div>

            {/* Pay button */}
            <button
              disabled={paying}
              onClick={checkout}
              className="flex w-full tap-target items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" /> Charge {fmtMoney(Number(sel.services?.price) + tip)}
                </>
              )}
            </button>
            <p className="text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Stripe Terminal · Mock
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
