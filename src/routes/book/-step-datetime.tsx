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
    <main id="main-content" className="w-full space-y-6">
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
                className={`shrink-0 tap-target flex flex-col items-center justify-center rounded-2xl px-5 py-3 transition active:scale-[0.97] duration-150 ${
                  selected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-surface text-foreground hover:bg-surface-2"
                }`}
              >
                <span className="text-xs uppercase tracking-wider font-medium">
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="mt-0.5 text-xl font-bold leading-none">{d.getDate()}</span>
                {isToday && !selected && (
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">
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
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-surface animate-pulse"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No availability on this date. Please select another date.
          </p>
        ) : (
          <div
            role="radiogroup"
            aria-label="Available time slots"
            className="grid grid-cols-2 gap-2"
          >
            {slots.map((t) => {
              const selected = slot !== null && slot.getTime() === t.getTime();
              return (
                <button
                  key={t.toISOString()}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSlotChange(t)}
                  className={`py-3 rounded-xl text-sm text-center font-mono font-medium tabular-nums transition duration-150 active:scale-[0.97] ${
                    selected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-surface text-foreground hover:bg-surface-2 border border-border hover:border-primary/50"
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
    </main>
  );
}
