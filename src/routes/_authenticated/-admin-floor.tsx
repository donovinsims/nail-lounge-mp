import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { FloorStatusRow } from "@/integrations/supabase/rows";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "./-admin-components/status-badge";
import { Users } from "lucide-react";

type FloorWithStaff = FloorStatusRow & {
  staff: { name: string; avatar_color: string | null } | null;
};

export default function FloorView({ salonId }: { salonId: string }) {
  const qc = useQueryClient();

  const { data: floor = [] } = useQuery({
    queryKey: ["floor", salonId],
    queryFn: async () => {
      const { data } = await supabase
        .from("floor_status")
        .select("*, staff(name, avatar_color)")
        .eq("salon_id", salonId);
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("floor-" + salonId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "floor_status", filter: `salon_id=eq.${salonId}` },
        () => qc.invalidateQueries({ queryKey: ["floor", salonId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [salonId, qc]);

  const cycle = async (id: string, current: Database["public"]["Enums"]["floor_state"]) => {
    const next =
      current === "available" ? "with_client" : current === "with_client" ? "offline" : "available";
    await supabase
      .from("floor_status")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", id);
  };

  if (floor.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="No staff on floor"
        body="Staff members will appear here once they check in. Tap a staff card to cycle through their status."
      />
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {floor.map((f: FloorWithStaff) => {
          const isWithClient = f.status === "with_client";
          return (
            <button
              key={f.id}
              onClick={() => cycle(f.id, f.status)}
              className={`rounded-2xl p-5 text-left transition-all active:scale-[0.98] ${
                isWithClient
                  ? "bg-surface ring-1 ring-warning/20 shadow-sm"
                  : "bg-surface hover:bg-surface-2"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div
                    className="h-14 w-14 rounded-full grid place-items-center text-white font-bold text-lg shadow-sm"
                    style={{ background: f.staff?.avatar_color || "#888" }}
                  >
                    {f.staff?.name?.[0]}
                  </div>
                  {/* Status indicator ring */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-surface ${
                      f.status === "available"
                        ? "bg-success"
                        : f.status === "with_client"
                          ? "bg-warning animate-pulse"
                          : "bg-muted"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate text-base">{f.staff?.name}</p>
                  <div className="mt-1">
                    <StatusBadge status={f.status} pulse={f.status === "with_client"} />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground text-center">
        Tap a staff card to cycle their status · live updates
      </p>
    </div>
  );
}
