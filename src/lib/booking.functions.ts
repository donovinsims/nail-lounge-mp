import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public booking functions — use service role inside handler for validated public writes.
// All operations validate input and confirm slot availability before writing.

const PHONE_RE = /^\+?[0-9\s\-()]{7,20}$/;

export const createPublicBooking = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        salonId: z.string().uuid(),
        serviceId: z.string().uuid(),
        staffId: z.string().uuid(),
        startTime: z.string(),
        clientName: z.string().trim().min(1).max(100),
        clientPhone: z.string().regex(PHONE_RE),
        clientEmail: z.string().email().optional().or(z.literal("")),
        depositPaid: z.number().min(0),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Validate service & salon
    const { data: service, error: svcErr } = await supabaseAdmin
      .from("services")
      .select("id, duration_minutes, buffer_after_minutes, salon_id")
      .eq("id", data.serviceId)
      .eq("salon_id", data.salonId)
      .maybeSingle();
    if (svcErr || !service) throw new Error("Service not found");

    const start = new Date(data.startTime);
    const end = new Date(start.getTime() + service.duration_minutes * 60_000);
    const blockEnd = new Date(end.getTime() + (service.buffer_after_minutes ?? 0) * 60_000);

    // Conflict check
    const { data: conflicts } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("staff_id", data.staffId)
      .in("status", ["confirmed", "completed"])
      .lt("start_time", blockEnd.toISOString())
      .gt("end_time", start.toISOString());
    if (conflicts && conflicts.length > 0) throw new Error("That time is no longer available");

    // Upsert client
    const phone = data.clientPhone.replace(/\s/g, "");
    const { data: existingClient } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("salon_id", data.salonId)
      .eq("phone", phone)
      .maybeSingle();
    let clientId = existingClient?.id;
    if (!clientId) {
      const { data: created, error: cErr } = await supabaseAdmin
        .from("clients")
        .insert({
          salon_id: data.salonId,
          phone,
          name: data.clientName,
          email: data.clientEmail || null,
        })
        .select("id")
        .single();
      if (cErr || !created) throw new Error("Could not save client");
      clientId = created.id;
    }

    const { data: booking, error: bErr } = await supabaseAdmin
      .from("bookings")
      .insert({
        salon_id: data.salonId,
        service_id: data.serviceId,
        staff_id: data.staffId,
        client_id: clientId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        deposit_paid: data.depositPaid,
        status: "confirmed",
      })
      .select("id")
      .single();
    if (bErr || !booking) throw new Error("Could not create booking");
    return { bookingId: booking.id };
  });

export const lookupAppointments = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ phone: z.string().regex(PHONE_RE) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const phone = data.phone.replace(/\s/g, "");
    const { data: rows } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, start_time, end_time, status, deposit_paid, services(name, price), staff(name), clients!inner(name, phone, salon_id), salons(name, address)",
      )
      .eq("clients.phone", phone)
      .order("start_time", { ascending: false })
      .limit(50);
    return rows ?? [];
  });

export const cancelPublicBooking = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ bookingId: z.string().uuid(), phone: z.string().regex(PHONE_RE) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const phone = data.phone.replace(/\s/g, "");
    const { data: bk } = await supabaseAdmin
      .from("bookings")
      .select("id, clients!inner(phone)")
      .eq("id", data.bookingId)
      .maybeSingle();
    if (!bk || (bk as any).clients?.phone !== phone) throw new Error("Booking not found");
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", data.bookingId);
    if (error) throw new Error("Could not cancel");
    return { ok: true };
  });
