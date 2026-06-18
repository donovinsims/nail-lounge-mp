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
    <div className="w-full space-y-6">
      {/* 14-day date scroller */}
      <div>
        <p className="mb-3 text-xs font-medium text-muted-foreground">Pick a day</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 14 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            d.setHours(0, 0, 0, 0);
            const selected = d.toDateString() === date.toDateString();
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <button
                key={i}
                onClick={() => {
                  onDateChange(d);
                  onSlotChange(null);
                }}
                className={`shrink-0 tap-target flex flex-col items-center justify-center rounded-2xl px-5 py-3 transition active:scale-[0.97] duration-75 ${
                  selected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-surface text-foreground hover:bg-surface-2"
                }`}
              >
                <span className="text-[11px] uppercase tracking-wider font-medium">
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="mt-0.5 text-xl font-bold leading-none">{d.getDate()}</span>
                {isToday && !selected && (
                  <span className="text-[9px] uppercase tracking-wider text-accent mt-1">
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <p className="mb-3 text-xs font-medium text-muted-foreground">Available times</p>

        {loadingSlots ? (
          <div className="flex flex-col gap-2 w-full">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-surface animate-pulse w-full"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No availability this day. Try another date.
          </p>
        ) : (
          <div role="radiogroup" aria-label="Available time slots" className="flex flex-col gap-2 w-full">
            {slots.map((t) => {
              const selected = slot !== null && slot.getTime() === t.getTime();
              return (
                <button
                  key={t.toISOString()}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSlotChange(t)}
                  className={`w-full py-4 rounded-xl text-sm text-center font-medium transition-all duration-75 active:scale-[0.98] ${
                    selected
                      ? "bg-primary/5 text-primary ring-2 ring-ring shadow-sm"
                      : "bg-surface text-foreground hover:bg-surface-2"
                  }`}
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
