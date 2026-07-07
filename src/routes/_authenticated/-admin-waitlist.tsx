import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { StatusBadge } from "./-admin-components/status-badge";
import { Phone, User, Plus, Clock, Zap } from "lucide-react";

export default function Waitlist({ salonId }: { salonId: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ client_name: "", client_phone: "" });
  const [adding, setAdding] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["wl", salonId],
    queryFn: async () => {
      const { data } = await supabase
        .from("waitlist_entries")
        .select("*, staff(name), services(name)")
        .eq("salon_id", salonId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const add = async () => {
    if (!form.client_name || !form.client_phone) return;
    setAdding(true);
    await supabase
      .from("waitlist_entries")
      .insert({ salon_id: salonId, ...form, preferred_time_windows: [] });
    setForm({ client_name: "", client_phone: "" });
    setAdding(false);
    qc.invalidateQueries();
  };

  const activeCount = rows.filter(
    (r: Database["public"]["Tables"]["waitlist_entries"]["Row"]) => r.status === "active",
  ).length;

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>
          {activeCount} active, {rows.length - activeCount} fulfilled
        </span>
      </div>

      {/* Add form */}
      <div className="rounded-2xl bg-surface p-5">
        <h3 className="font-semibold mb-3">Add to waitlist</h3>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Client name"
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              className="w-full tap-target rounded-xl bg-surface-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="relative flex-1 min-w-[180px]">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Phone"
              value={form.client_phone}
              onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
              className="w-full tap-target rounded-xl bg-surface-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={add}
            disabled={adding || !form.client_name || !form.client_phone}
            className="tap-target inline-flex items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      {/* List */}
      <ul className="space-y-2">
        {rows.length === 0 && (
          <li className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-2">
            <Clock className="h-8 w-8 text-muted-foreground/40" />
            <span>No waitlist entries.</span>
          </li>
        )}
        {rows.map((r: Database["public"]["Tables"]["waitlist_entries"]["Row"]) => (
          <li
            key={r.id}
            className={`rounded-2xl bg-surface p-4 transition-colors ${
              r.flagged_booking_id ? "ring-1 ring-success/20" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{r.client_name}</p>
                  {r.flagged_booking_id && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-mono text-success">
                      <Zap className="h-3 w-3" /> Slot opened
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{r.client_phone}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
