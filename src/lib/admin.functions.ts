import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getSalonId } from "@/lib/env";
import type { BookingInsert, CommissionRecordInsert } from "@/integrations/supabase/rows";
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
    // Demo helper: if user has no staff row, link them as owner of the configured salon.
    const { data: existing } = await context.supabase
      .from("staff")
      .select("id")
      .eq("auth_user_id", context.userId)
      .maybeSingle();
    if (existing) return { ok: true, already: true };
    const salonId = getSalonId();
    if (!salonId) throw new Error("SALON_ID not configured — set VITE_SALON_ID in .env");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", context.userId)
      .maybeSingle();
    await supabaseAdmin.from("staff").insert({
      salon_id: salonId,
      auth_user_id: context.userId,
      name: profile?.full_name || profile?.email || "Owner",
      role: "owner",
      working_hours: {},
    });
    return { ok: true, linked: true };
  });

export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Adds demo data — bookings spread across this week + commission records + AI calls
    // First-run safety: refuse to seed if the salon already has real data.
    const { data: staff } = await context.supabase
      .from("staff")
      .select("id, salon_id")
      .eq("auth_user_id", context.userId)
      .maybeSingle();
    if (!staff) throw new Error("Not linked to salon");

    // Guard: only seed if the salon has zero existing data (first-run).
    const { count: existingBookings } = await context.supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("salon_id", staff.salon_id);
    if (existingBookings && existingBookings > 0) {
      throw new Error("Salon already has data — seed skipped");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: services } = await supabaseAdmin
      .from("services")
      .select("id, name, price, duration_minutes")
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

    // Build a schedule spread across this week so charts show data
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 4=Thu
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(9, 0, 0, 0);

    // Define the daily schedule — each day has a list of { hour, svcIndex, status }
    const schedule: {
      hour: number;
      svcIndex: number;
      status: "completed" | "confirmed" | "cancelled";
    }[] = [
      // Monday (past — completed for bar chart)
      { hour: 9, svcIndex: 0, status: "completed" },
      { hour: 10, svcIndex: 1, status: "completed" },
      { hour: 11, svcIndex: 2, status: "completed" },
      { hour: 14, svcIndex: 3, status: "completed" },
      // Tuesday
      { hour: 9, svcIndex: 1, status: "completed" },
      { hour: 11, svcIndex: 0, status: "completed" },
      { hour: 13, svcIndex: 2, status: "completed" },
      { hour: 15, svcIndex: 1, status: "completed" },
      // Wednesday (mixed)
      { hour: 10, svcIndex: 3, status: "completed" },
      { hour: 11, svcIndex: 0, status: "completed" },
      { hour: 14, svcIndex: 2, status: "completed" },
      { hour: 16, svcIndex: 1, status: "confirmed" }, // future slot
      // Thursday / today
      { hour: 9, svcIndex: 0, status: "confirmed" },
      { hour: 10, svcIndex: 2, status: "confirmed" },
      { hour: 11, svcIndex: 1, status: "confirmed" },
      { hour: 13, svcIndex: 3, status: "confirmed" },
      { hour: 14, svcIndex: 0, status: "confirmed" },
    ];

    const commissionSplit = 60; // default 60% tech
    const tipSplit = 80; // default 80% tip to tech
    const allBookings: BookingInsert[] = [];
    const allCommissions: CommissionRecordInsert[] = [];
    let bookingCount = 0;

    for (let dayOff = 0; dayOff < 4; dayOff++) {
      const dayStart = new Date(monday);
      dayStart.setDate(monday.getDate() + dayOff);

      // Only create past data for days before today
      const isPastDay = dayStart.toDateString() !== now.toDateString();

      const daySchedule = schedule.filter((_, i) => {
        if (dayOff === 0) return i < 4; // Mon: first 4
        if (dayOff === 1) return i >= 4 && i < 8; // Tue: next 4
        if (dayOff === 2) return i >= 8 && i < 12; // Wed: next 4
        return i >= 12; // Thu: last 5
      });

      for (const slot of daySchedule) {
        const svc = services[slot.svcIndex % services.length];
        const stf = staffList[bookingCount % staffList.length];
        const clt = clients[bookingCount % clients.length];
        const start = new Date(dayStart);
        start.setHours(slot.hour, 0, 0, 0);
        start.setMinutes(Math.floor(bookingCount * 17) % 60); // offset within hour
        const end = new Date(start.getTime() + (svc.duration_minutes || 45) * 60_000);

        allBookings.push({
          salon_id: staff.salon_id,
          service_id: svc.id,
          staff_id: stf.id,
          client_id: clt.id,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          status: slot.status,
        });

        // Create commission records for past completed bookings
        if (slot.status === "completed" && isPastDay) {
          const price = Number(svc.price ?? 50);
          const net = price;
          const techShare = +((net * commissionSplit) / 100).toFixed(2);
          const salonShare = +(net - techShare).toFixed(2);
          allCommissions.push({
            salon_id: staff.salon_id,
            booking_id: "" as string, // set after insert
            staff_id: stf.id,
            gross_amount: price,
            net_amount: net,
            tech_share: techShare,
            salon_share: salonShare,
            created_at: new Date(start.getTime() + 60 * 60_000).toISOString(), // ~1hr after booking start
          });
        }

        bookingCount++;
      }
    }

    // Insert bookings
    const { data: inserted } = await supabaseAdmin
      .from("bookings")
      .insert(allBookings)
      .select("id");
    const insertedIds = inserted?.map((b: { id: string }) => b.id) ?? [];

    // Link commission records to inserted booking IDs
    let ci = 0;
    for (let i = 0; i < allBookings.length; i++) {
      if (allBookings[i].status === "completed" && ci < allCommissions.length) {
        allCommissions[ci].booking_id = insertedIds[i]!;
        ci++;
      }
    }
    if (allCommissions.length > 0) {
      await supabaseAdmin.from("commission_records").insert(allCommissions);
    }

    // AI calls
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
    return { ok: true, bookings: allBookings.length, commissions: allCommissions.length };
  });
