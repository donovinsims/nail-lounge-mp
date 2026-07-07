import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getSalonId } from "@/lib/env";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

type StaffUpdate = Database["public"]["Tables"]["staff"]["Update"];
type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"];
type SalonUpdate = Database["public"]["Tables"]["salons"]["Update"];

const SALON_ID_FILTER = () => {
  const id = getSalonId();
  if (!id) throw new Error("SALON_ID not configured");
  return id;
};

// ── Input schemas (exported so tests validate the real thing, not copies) ──

export const createStaffSchema = z.object({
  name: z.string().trim().min(1).max(100),
  role: z.enum(["owner", "staff"]).default("staff"),
  workingHours: z.record(z.any()).default({}),
  avatarColor: z.string().default("#0a0a0a"),
});

export const updateStaffSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(100).optional(),
  role: z.enum(["owner", "staff"]).optional(),
  workingHours: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  avatarColor: z.string().optional(),
});

export const deleteStaffSchema = z.object({ id: z.string().uuid() });

export const createServiceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().max(100).optional().or(z.literal("")),
  durationMinutes: z.number().int().min(5).max(480),
  price: z.number().min(0),
  bufferAfterMinutes: z.number().int().min(0).default(0),
});

export const updateServiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(200).optional(),
  category: z.string().trim().max(100).optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  price: z.number().min(0).optional(),
  bufferAfterMinutes: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const deleteServiceSchema = z.object({ id: z.string().uuid() });

export const updateSalonHoursSchema = z.object({
  businessHours: z.record(z.any()),
  holidaySchedule: z.array(z.any()).optional(),
});

// ── Staff CRUD ────────────────────────────────────────────────────────

export const getAllStaffForSalon = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const salonId = SALON_ID_FILTER();
    const { data } = await context.supabase
      .from("staff")
      .select("id, name, role, working_hours, is_active, avatar_color")
      .eq("salon_id", salonId)
      .order("name");
    return data ?? [];
  });

export const createStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => createStaffSchema.parse(d))
  .handler(async ({ data, context }) => {
    const salonId = SALON_ID_FILTER();
    const { data: staff, error } = await context.supabase
      .from("staff")
      .insert({
        salon_id: salonId,
        name: data.name,
        role: data.role,
        working_hours: data.workingHours,
        avatar_color: data.avatarColor,
      })
      .select("id, name, role, working_hours, is_active, avatar_color")
      .single();
    if (error) throw new Error(error.message);
    return staff;
  });

export const updateStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => updateStaffSchema.parse(d))
  .handler(async ({ data, context }) => {
    const salonId = SALON_ID_FILTER();
    const update: StaffUpdate = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.role !== undefined) update.role = data.role;
    if (data.workingHours !== undefined) update.working_hours = data.workingHours;
    if (data.isActive !== undefined) update.is_active = data.isActive;
    if (data.avatarColor !== undefined) update.avatar_color = data.avatarColor;

    const { data: staff, error } = await context.supabase
      .from("staff")
      .update(update)
      .eq("id", data.id)
      .eq("salon_id", salonId)
      .select("id, name, role, working_hours, is_active, avatar_color")
      .single();
    if (error) throw new Error(error.message);
    return staff;
  });

export const deleteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => deleteStaffSchema.parse(d))
  .handler(async ({ data, context }) => {
    const salonId = SALON_ID_FILTER();
    const { error } = await context.supabase
      .from("staff")
      .update({ is_active: false })
      .eq("id", data.id)
      .eq("salon_id", salonId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── Services CRUD ──────────────────────────────────────────────────────

export const getAllServicesForSalon = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const salonId = SALON_ID_FILTER();
    const { data } = await context.supabase
      .from("services")
      .select("id, name, category, duration_minutes, price, buffer_after_minutes, is_active")
      .eq("salon_id", salonId)
      .order("name");
    return data ?? [];
  });

export const createService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => createServiceSchema.parse(d))
  .handler(async ({ data, context }) => {
    const salonId = SALON_ID_FILTER();
    const { data: service, error } = await context.supabase
      .from("services")
      .insert({
        salon_id: salonId,
        name: data.name,
        category: data.category || null,
        duration_minutes: data.durationMinutes,
        price: data.price,
        buffer_after_minutes: data.bufferAfterMinutes,
      })
      .select("id, name, category, duration_minutes, price, buffer_after_minutes, is_active")
      .single();
    if (error) throw new Error(error.message);
    return service;
  });

export const updateService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => updateServiceSchema.parse(d))
  .handler(async ({ data, context }) => {
    const salonId = SALON_ID_FILTER();
    const update: ServiceUpdate = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.category !== undefined) update.category = data.category || null;
    if (data.durationMinutes !== undefined) update.duration_minutes = data.durationMinutes;
    if (data.price !== undefined) update.price = data.price;
    if (data.bufferAfterMinutes !== undefined)
      update.buffer_after_minutes = data.bufferAfterMinutes;
    if (data.isActive !== undefined) update.is_active = data.isActive;

    const { data: service, error } = await context.supabase
      .from("services")
      .update(update)
      .eq("id", data.id)
      .eq("salon_id", salonId)
      .select("id, name, category, duration_minutes, price, buffer_after_minutes, is_active")
      .single();
    if (error) throw new Error(error.message);
    return service;
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => deleteServiceSchema.parse(d))
  .handler(async ({ data, context }) => {
    const salonId = SALON_ID_FILTER();
    const { error } = await context.supabase
      .from("services")
      .update({ is_active: false })
      .eq("id", data.id)
      .eq("salon_id", salonId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── Salon Settings ──────────────────────────────────────────────────────

export const updateSalonHours = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => updateSalonHoursSchema.parse(d))
  .handler(async ({ data, context }) => {
    const salonId = SALON_ID_FILTER();
    const update: SalonUpdate = { business_hours: data.businessHours };
    if (data.holidaySchedule !== undefined) update.holiday_schedule = data.holidaySchedule;

    const { error } = await context.supabase.from("salons").update(update).eq("id", salonId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
