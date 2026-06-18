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
}

export default function StepService({ services, selectedId, onSelect }: StepServiceProps) {
  if (services === null) {
    return (
      <div className="grid place-items-center py-10">
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40" />
          Loading services…
        </span>
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
                className={`flex w-full tap-target items-center justify-between gap-3 rounded-2xl bg-surface p-4 text-left active:scale-[0.99] transition ${
                  isSelected ? "ring-2 ring-ring" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{service.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {service.category ?? "Nail"} · {service.duration_minutes} min
                  </p>
                </div>
                <p className="shrink-0 font-mono text-sm font-semibold">
                  {fmtMoney(Number(service.price))}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
