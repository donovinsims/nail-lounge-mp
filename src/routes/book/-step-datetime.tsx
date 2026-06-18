import { Loader2 } from "lucide-react";

interface StepDateTimeProps {
  date: Date;
  onDateChange: (d: Date) => void;
  slot: Date | null;
  onSlotChange: (d: Date | null) => void;
  slots: Date[];
  loadingSlots: boolean;
}

export default function StepDateTime({
  date,
  onDateChange,
  slot,
  onSlotChange,
  slots,
  loadingSlots,
}: StepDateTimeProps) {
  return (
    <div>
      {/* 14-day date scroller */}
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-3">
        {Array.from({ length: 14 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i);
          d.setHours(0, 0, 0, 0);
          const selected = d.toDateString() === date.toDateString();
          return (
            <button
              key={i}
              onClick={() => {
                onDateChange(d);
                onSlotChange(null);
              }}
              className={`shrink-0 flex flex-col items-center justify-center rounded-2xl px-4 py-3 ${selected ? "bg-primary text-primary-foreground" : "bg-surface"}`}
            >
              <span className="text-[10px] uppercase tracking-wider">
                {d.toLocaleDateString("en-US", { weekday: "short" })}
              </span>
              <span className="mt-0.5 text-lg font-bold">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      <div className="mt-4">
        {loadingSlots ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : slots.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No availability this day. Try another.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {slots.map((t) => {
              const selected = slot !== null && slot.getTime() === t.getTime();
              return (
                <button
                  key={t.toISOString()}
                  onClick={() => onSlotChange(t)}
                  className={`tap-target rounded-xl py-3 text-sm font-medium ${selected ? "bg-primary text-primary-foreground" : "bg-surface"}`}
                >
                  {t.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
