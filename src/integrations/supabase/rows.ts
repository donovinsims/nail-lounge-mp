import type { Database, Json } from "./types";

// ── Row types ──
export type SalonRow = Database["public"]["Tables"]["salons"]["Row"];
export type SalonUpdate = Database["public"]["Tables"]["salons"]["Update"];

export type StaffRow = Database["public"]["Tables"]["staff"]["Row"];
export type StaffInsert = Database["public"]["Tables"]["staff"]["Insert"];
export type StaffUpdate = Database["public"]["Tables"]["staff"]["Update"];

export type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
export type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"];
export type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"];

export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
export type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];

export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

export type CommissionRecordRow = Database["public"]["Tables"]["commission_records"]["Row"];
export type CommissionRecordInsert = Database["public"]["Tables"]["commission_records"]["Insert"];

export type WaitlistEntryRow = Database["public"]["Tables"]["waitlist_entries"]["Row"];
export type FloorStatusRow = Database["public"]["Tables"]["floor_status"]["Row"];
export type AiCallRow = Database["public"]["Tables"]["ai_calls"]["Row"];
export type OwnerAlertRow = Database["public"]["Tables"]["owner_alerts"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type { Json };
