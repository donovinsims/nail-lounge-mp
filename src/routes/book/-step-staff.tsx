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
}

export default function StepStaff({ staff, selectedId, onSelect }: StepStaffProps) {
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
                className={`flex w-full tap-target items-center gap-4 rounded-2xl bg-surface p-4 text-left ${isSelected ? "ring-2 ring-ring" : ""}`}
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
                  <p className="text-xs text-muted-foreground capitalize">
                    {member.title || member.role}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
