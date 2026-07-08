import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getSalonId } from "@/lib/env";

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
const dayKeys: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export interface Hours {
  open: string;
  close: string;
}
export type BusinessHours = Partial<Record<DayKey, Hours>>;

/**
 * Narrow a Supabase `Json` column (salon.business_hours, staff.working_hours)
 * to the BusinessHours shape without resorting to `any`.
 */
export function asBusinessHours(value: unknown): BusinessHours {
  return (value ?? {}) as BusinessHours;
}

export function dayKey(d: Date): DayKey {
  return dayKeys[d.getDay()];
}

export async function fetchSalon() {
  const salonId = getSalonId();
  if (!salonId) throw new Error("VITE_SALON_ID is not set");
  const { data, error } = await supabase
    .from("salons")
    .select("id, name, address, phone, business_hours, holiday_schedule, created_at")
    .eq("id", salonId)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchServices(salonId: string) {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .order("category");
  if (error) throw error;
  return data ?? [];
}

export async function fetchStaff(salonId: string) {
  const { data, error } = await supabase
    .from("staff")
    .select(
      "id, salon_id, name, title, bio, specialties, avatar_url, avatar_color, sort_order, working_hours, is_active, created_at",
    )
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

/**
 * Compute available 15-min start slots for a given staff/service on a date.
 * Delegates to get_available_slots Postgres RPC.
 */
export async function computeAvailableSlots(
  supabase: SupabaseClient<Database>,
  staffId: string,
  date: Date,
  durationMinutes: number,
  salonId?: string,
): Promise<Date[]> {
  const sid = salonId ?? getSalonId();
  if (!sid) throw new Error("VITE_SALON_ID is not set");

  const { data, error } = await supabase.rpc("get_available_slots", {
    p_staff_id: staffId,
    p_date: date.toISOString().split("T")[0],
    p_service_duration_minutes: durationMinutes,
    p_salon_id: sid,
  });

  if (error) {
    console.error("get_available_slots RPC failed:", error);
    return [];
  }

  return (data ?? []).map((row) => new Date(row.start_time));
}

/**
 * Compute available slots for multiple staff members at once.
 * Returns a Map of staffId → Date[] and a merged, deduplicated array of all slots.
 */
export async function computeSlotsForAllStaff(
  supabase: SupabaseClient<Database>,
  staffIds: string[],
  date: Date,
  durationMinutes: number,
  salonId?: string,
): Promise<{ staffMap: Map<string, Date[]>; mergedSlots: Date[] }> {
  const staffMap = new Map<string, Date[]>();
  const allSlots: Date[] = [];

  await Promise.all(
    staffIds.map(async (id) => {
      const slots = await computeAvailableSlots(supabase, id, date, durationMinutes, salonId);
      staffMap.set(id, slots);
      allSlots.push(...slots);
    }),
  );

  // Deduplicate by timestamp and sort
  const mergedSlots = [...new Set(allSlots.map((t) => t.getTime()))]
    .map((t) => new Date(t))
    .sort((a, b) => a.getTime() - b.getTime());

  return { staffMap, mergedSlots };
}
