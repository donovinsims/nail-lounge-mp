import { fmtTime, fmtDate, fmtMoney } from "@/lib/utils";

export interface BookingSummaryProps {
  service: { name: string; price: number } | null;
  staff: { name: string } | null;
  slot: Date | null;
}

export default function BookingSummary({ service, staff, slot }: BookingSummaryProps) {
  return (
    <aside className="rounded-2xl bg-surface p-5 text-sm space-y-3">
      <h2 className="font-semibold text-base">Your Booking</h2>

      <div className="space-y-1.5">
        <Row label="Service" value={service?.name ?? null} />
        <Row label="Artist" value={staff?.name ?? null} />
        <Row label="When" value={slot ? `${fmtDate(slot)}, ${fmtTime(slot)}` : null} mono />
      </div>

      <div className="border-t border-border" />

      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-mono font-semibold">{fmtMoney(Number(service?.price ?? 0))}</span>
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={value ? `font-medium${mono ? " font-mono" : ""}` : "text-muted-foreground"}>
        {value ?? "Not selected"}
      </span>
    </div>
  );
}
