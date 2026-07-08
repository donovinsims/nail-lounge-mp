import { Clock, Check } from "lucide-react";
import { useMemo } from "react";
import { cn, fmtMoney } from "@/lib/utils";

export interface Service {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  duration_minutes: number;
  price: number;
}

export interface StepServiceProps {
  services: Service[] | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

export default function StepService({
  services,
  selectedId,
  onSelect,
  isLoading,
}: StepServiceProps) {
  const grouped = useMemo(() => {
    if (!services) return [];
    const map = new Map<string, Service[]>();
    for (const s of services) {
      const cat = s.category || "Other";
      const arr = map.get(cat) ?? [];
      arr.push(s);
      map.set(cat, arr);
    }
    return Array.from(map, ([category, items]) => ({ category, items }));
  }, [services]);

  if (services === null || isLoading) {
    return (
      <div className="grid place-items-center py-10">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1">
            <span
              className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40"
              style={{ animationDelay: "300ms" }}
            />
          </div>
          <span className="text-sm text-muted-foreground">Loading services…</span>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No services are available right now. Please check back later or call us to book.
      </div>
    );
  }
  return (
    <div role="radiogroup" aria-label="Select a service" className="space-y-10">
      {grouped.map(({ category, items }) => (
        <section key={category}>
          <h3 className="font-display mb-3 text-xl">{category}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((service) => {
              const isSelected = service.id === selectedId;
              return (
                <button
                  key={service.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelect(service.id)}
                  className={cn(
                    "group relative rounded-xl border p-4 text-left transition hover:-translate-y-0.5 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-sm",
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-border bg-surface hover:border-primary/50 hover:shadow-md",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium">{service.name}</span>
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                        isSelected
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      {isSelected && <Check className="size-3.5" />}
                    </span>
                  </div>
                  {service.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{fmtMoney(service.price)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {service.duration_minutes} min
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
