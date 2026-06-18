import { Check } from "lucide-react";

interface Props {
  step: number; // 1–4
  onStepClick: (s: number) => void;
}

const LABELS = ["Service", "Artist", "Date & Time", "Confirm"];
const MOBILE_LABELS = ["Service", "Artist", "Date/Time", "Confirm"];

export default function BookingStepProgress({ step, onStepClick }: Props) {
  return (
    <nav role="navigation" aria-label="Booking progress">
      <div className="flex items-center justify-center">
        {LABELS.map((label, i) => {
          const num = i + 1;
          const isCompleted = num < step;
          const isCurrent = num === step;
          const isFuture = num > step;

          return (
            <div key={num} className="flex items-center">
              {i > 0 && (
                <div
                  className={`h-0.5 w-6 sm:w-12 mx-1 sm:mx-2 rounded-full ${
                    isCompleted || isCurrent ? "bg-accent" : "bg-muted"
                  }`}
                  aria-hidden="true"
                />
              )}
              <div className="flex flex-col items-center gap-1.5">
                {isCurrent ? (
                  <button
                    type="button"
                    aria-current="step"
                    aria-label={`Step ${num}: ${label}`}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-accent text-accent-foreground text-sm font-semibold flex items-center justify-center cursor-default ring-2 ring-accent ring-offset-2 ring-offset-background"
                  >
                    {num}
                  </button>
                ) : isCompleted ? (
                  <button
                    type="button"
                    aria-label={`Step ${num}: ${label} (completed)`}
                    onClick={() => onStepClick(num)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-accent text-accent-foreground text-sm font-semibold flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label={`Step ${num}: ${label}`}
                    disabled
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-muted text-muted-foreground text-sm font-semibold flex items-center justify-center cursor-default"
                  >
                    {num}
                  </button>
                )}
                <span
                  className={`text-[11px] sm:text-xs font-medium whitespace-nowrap ${
                    isCurrent ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{MOBILE_LABELS[i]}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
