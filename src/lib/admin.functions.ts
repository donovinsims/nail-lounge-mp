import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMyStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: staff } = await context.supabase
      .from("staff")
      .select("id, name, role, salon_id, salons(*)")
      .eq("auth_user_id", context.userId)
      .maybeSingle();
    return staff;
  });

export const linkSelfToFirstSalon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Demo helper: if user has no staff row, link them as owner of the first salon.
    const { data: existing } = await context.supabase
      .from("staff")
      .select("id")
      .eq("auth_user_id", context.userId)
      .maybeSingle();
    if (existing) return { ok: true, already: true };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: salon } = await supabaseAdmin.from("salons").select("id").limit(1).single();
    if (!salon) throw new Error("No salon");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", context.userId)
      .maybeSingle();
    await supabaseAdmin.from("staff").insert({
      salon_id: salon.id,
      auth_user_id: context.userId,
      name: profile?.full_name || profile?.email || "Owner",
      role: "owner",
      working_hours: {},
    });
    return { ok: true, linked: true };
  });

export const completeBookingWithPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        bookingId: z.string().uuid(),
        tipAmount: z.number().min(0),
        tipToTechPercent: z.number().min(0).max(100),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: booking } = await context.supabase
      .from("bookings")
      .select("id, salon_id, staff_id, deposit_paid, services(price), salons(commission_split)")
      .eq("id", data.bookingId)
      .maybeSingle();
    if (!booking) throw new Error("Booking not found");
    const price = Number((booking as any).services?.price ?? 0);
    const commissionSplit = Number((booking as any).salons?.commission_split ?? 60);
    const net = price; // simplified — no fees in mock
    const techShare = +((net * commissionSplit) / 100).toFixed(2);
    const salonShare = +(net - techShare).toFixed(2);
    const tipToTech = +((data.tipAmount * data.tipToTechPercent) / 100).toFixed(2);
    const tipToSalon = +(data.tipAmount - tipToTech).toFixed(2);

    await context.supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", data.bookingId);
    const { error } = await context.supabase.from("commission_records").insert({
      salon_id: booking.salon_id,
      booking_id: booking.id,
      staff_id: booking.staff_id,
      gross_amount: price,
      net_amount: net,
      tech_share: techShare,
      salon_share: salonShare,
      tip_amount: data.tipAmount,
      tip_to_tech: tipToTech,
      tip_to_salon: tipToSalon,
    });
    if (error) throw error;
    return { ok: true, techShare, salonShare, tipToTech, tipToSalon };
  });

export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Adds demo bookings + AI calls for current salon (idempotent-ish)
    const { data: staff } = await context.supabase
      .from("staff")
      .select("id, salon_id")
      .eq("auth_user_id", context.userId)
      .maybeSingle();
    if (!staff) throw new Error("Not linked to salon");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: services } = await supabaseAdmin
      .from("services")
      .select("id, duration_minutes")
      .eq("salon_id", staff.salon_id);
    const { data: staffList } = await supabaseAdmin
      .from("staff")
      .select("id")
      .eq("salon_id", staff.salon_id);
    const { data: clients } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("salon_id", staff.salon_id);
    if (!services?.length || !staffList?.length || !clients?.length) return { ok: false };

    const today = new Date();
    today.setHours(10, 0, 0, 0);
    const bookings = [];
    for (let i = 0; i < 6; i++) {
      const start = new Date(today.getTime() + i * 75 * 60_000);
      const svc = services[i % services.length];
      bookings.push({
        salon_id: staff.salon_id,
        service_id: svc.id,
        staff_id: staffList[i % staffList.length].id,
        client_id: clients[i % clients.length].id,
        start_time: start.toISOString(),
        end_time: new Date(start.getTime() + svc.duration_minutes * 60_000).toISOString(),
        status: "confirmed" as const,
        deposit_paid: 10,
      });
    }
    await supabaseAdmin.from("bookings").insert(bookings);

    await supabaseAdmin.from("ai_calls").insert([
      {
        salon_id: staff.salon_id,
        caller_phone: "+15553334444",
        caller_name: "Emma R.",
        transcript:
          "Hi, I'd like to book a gel manicure this Saturday around 2pm with Mai if she's available.",
        intent: "book_appointment",
        intent_data: { service: "Gel Manicure", staff: "Mai", time_pref: "Saturday 2pm" },
        call_duration_seconds: 42,
      },
      {
        salon_id: staff.salon_id,
        caller_phone: "+15558889999",
        caller_name: "Unknown",
        transcript: "Are you open on Sunday? What time do you close today?",
        intent: "hours_inquiry",
        intent_data: {},
        call_duration_seconds: 18,
      },
    ]);
    return { ok: true, bookings: bookings.length };
  });
