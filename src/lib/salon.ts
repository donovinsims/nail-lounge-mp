import { supabase } from "@/integrations/supabase/client";

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
const dayKeys: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export interface Hours { open: string; close: string }
export type BusinessHours = Partial<Record<DayKey, Hours>>;

export function dayKey(d: Date): DayKey { return dayKeys[d.getDay()]; }

export async function fetchSalon() {
  const { data, error } = await supabase
    .from("salons")
    .select("id, name, address, phone, business_hours, holiday_schedule, created_at")
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchServices(salonId: string) {
  const { data, error } = await supabase
    .from("services").select("*").eq("salon_id", salonId).eq("is_active", true).order("category");
  if (error) throw error;
  return data ?? [];
}

export async function fetchStaff(salonId: string) {
  const { data, error } = await supabase
    .from("staff")
    .select("id, salon_id, name, title, bio, specialties, avatar_url, avatar_color, sort_order, working_hours, is_active, created_at")
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export const BUSINESS = {
  name: "Nail Lounge",
  address: "1513 West Lane Rd, Machesney Park, IL 61115",
  phone: "+1 815-977-3443",
  phoneHref: "+18159773443",
  email: "wait4alove@yahoo.com",
  mapsUrl: "https://share.google/qo03O2XzAhE7hTXjL",
  mapEmbed: "https://www.google.com/maps?q=1513+West+Lane+Rd,+Machesney+Park,+IL+61115&output=embed",
  booksy: "https://booksy.com/en-us/323657_nail-lounge_nail-salon_19333_machesney-park",
  yelp: "https://www.yelp.com/biz/nail-lounge-machesney-park",
  instagram: "https://www.instagram.com/nailloungemachesneypark",
  facebook: "https://www.facebook.com/nailloungemachesneypark",
  tiktok: "https://www.tiktok.com/@nailloungemp",
} as const;

/**
 * Compute available 15-min start slots for a given staff/service on a date.
 * Subtracts existing bookings + buffer.
 */
export async function computeAvailableSlots(opts: {
  salonId: string;
  staffId: string;
  serviceDurationMin: number;
  bufferAfterMin: number;
  date: Date;
  workingHours: BusinessHours;
  salonHours: BusinessHours;
}) {
  const dk = dayKey(opts.date);
  const wh = opts.workingHours?.[dk];
  const sh = opts.salonHours?.[dk];
  if (!wh || !sh) return [];
  const open = parseHM(opts.date, max(wh.open, sh.open));
  const close = parseHM(opts.date, min(wh.close, sh.close));

  // Fetch existing bookings on this date for this staff
  const dayStart = new Date(opts.date); dayStart.setHours(0,0,0,0);
  const dayEnd = new Date(opts.date); dayEnd.setHours(23,59,59,999);
  const { data: bookings } = await supabase.rpc("get_busy_slots", {
    p_staff_id: opts.staffId,
    p_day_start: dayStart.toISOString(),
    p_day_end: dayEnd.toISOString(),
  });

  const blocked = (bookings ?? []).map((b: any) => ({
    s: new Date(b.start_time).getTime(),
    e: new Date(b.end_time).getTime() + (b.buffer_after_minutes ?? 0) * 60_000,
  }));

  const slots: Date[] = [];
  const stepMs = 15 * 60_000;
  const needMs = (opts.serviceDurationMin + opts.bufferAfterMin) * 60_000;
  const now = Date.now();
  for (let t = open.getTime(); t + needMs <= close.getTime(); t += stepMs) {
    if (t < now + 30 * 60_000) continue; // 30min lead time
    const end = t + needMs;
    const overlaps = blocked.some((b) => t < b.e && end > b.s);
    if (!overlaps) slots.push(new Date(t));
  }
  return slots;
}

function parseHM(date: Date, hm: string) {
  const [h, m] = hm.split(":").map(Number);
  const d = new Date(date); d.setHours(h, m, 0, 0); return d;
}
function max(a: string, b: string) { return a > b ? a : b; }
function min(a: string, b: string) { return a < b ? a : b; }

export function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
export function fmtTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
export function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
