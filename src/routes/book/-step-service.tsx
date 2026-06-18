import { Check } from "lucide-react";
import { fmtMoney } from "@/lib/salon";

export interface Service {
  id: string;
  name: string;
  category: string | null;
  duration_minutes: number;
  price: number;
}

export interface StepServiceProps {
  services: Service[] | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

export default function StepService({ services, selectedId, onSelect, isLoading }: StepServiceProps) {
  if (services === null || isLoading) {
    return (
      <div className="grid place-items-center py-10">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1">
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "0ms" }} />
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "150ms" }} />
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-sm text-muted-foreground">Loading services…</span>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No services available right now.
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label="Select a service">
      <ul className="space-y-2">
        {services.map((service) => {
          const isSelected = service.id === selectedId;
          return (
            <li key={service.id}>
              <button
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(service.id)}
                className={`flex w-full tap-target items-center justify-between gap-3 rounded-2xl bg-surface p-4 text-left active:scale-[0.98] transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-ring bg-primary/5 shadow-sm"
                    : "hover:bg-surface-2"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{service.name}</p>
                  <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                    {service.category ?? "Nail"} · {service.duration_minutes} min
                  </p>
                </div>
                <p className="shrink-0 font-mono text-sm font-semibold">
                  {fmtMoney(Number(service.price))}
                </p>
                {isSelected && (
                  <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
