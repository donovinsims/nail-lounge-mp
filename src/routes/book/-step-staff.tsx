import { Check } from "lucide-react";

export interface StaffMember {
  id: string;
  name: string;
  title?: string | null;
  role?: string;
  avatar_color?: string | null;
}

export interface StepStaffProps {
  staff: StaffMember[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

export default function StepStaff({ staff, selectedId, onSelect, isLoading }: StepStaffProps) {
  if (isLoading) {
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
          <span className="text-sm text-muted-foreground">Loading artists…</span>
        </div>
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No artists available right now.
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label="Select an artist">
      <ul className="space-y-2">
        {staff.map((member) => {
          const isSelected = member.id === selectedId;
          return (
            <li key={member.id}>
              <button
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(member.id)}
                className={`flex w-full tap-target items-center gap-4 rounded-2xl bg-surface p-4 text-left active:scale-[0.98] transition-transform duration-150 ${
                  isSelected ? "ring-2 ring-ring bg-primary/5 shadow-sm" : "hover:bg-surface-2"
                }`}
              >
                <div
                  className="h-11 w-11 shrink-0 rounded-full grid place-items-center text-white font-semibold"
                  style={{ background: member.avatar_color || "var(--color-accent)" }}
                  aria-hidden="true"
                >
                  {member.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{member.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                    {member.title || member.role}
                  </p>
                </div>
                {isSelected && (
                  <span className="ml-auto shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
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
