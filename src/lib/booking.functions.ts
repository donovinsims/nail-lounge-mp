import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { RateLimiter } from "@/lib/rate-limiter";

// Public booking functions — use service role inside handler for validated public writes.
// All operations validate input and confirm slot availability before writing.

const PHONE_RE = /^\+?[0-9\s\-()]{7,20}$/;

// Rate limiter: max 3 booking attempts per phone number per 5 minutes (in-memory per process)
const bookingRateLimiter = new RateLimiter({ key: "booking", maxRequests: 3, windowMs: 300_000 });

// ── Input schemas (exported so tests validate the real thing, not copies) ──

export const createBookingSchema = z.object({
  salonId: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  startTime: z.string(),
  clientName: z.string().trim().min(1).max(100),
  clientPhone: z.string().regex(PHONE_RE),
  clientEmail: z.string().email().optional().or(z.literal("")),
});

export const lookupSchema = z.object({
  phone: z.string().regex(PHONE_RE),
  salonId: z.string().uuid(),
});

export const cancelSchema = z.object({
  bookingId: z.string().uuid(),
  phone: z.string().regex(PHONE_RE),
  salonId: z.string().uuid(),
});

export const completeStaffModalSchema = z.object({
  bookingId: z.string().uuid(),
  tipAmount: z.number().min(0).default(0),
  paymentMethod: z.enum(["Credit/Debit", "Cash", "Venmo", "Cash App"]),
  serviceNotes: z.string().default(""),
});

export const staffQuerySchema = z.object({
  staffId: z.string(),
});

export const createPublicBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => createBookingSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Rate limit: per phone number
    const { allowed } = await bookingRateLimiter.check(data.clientPhone);
    if (!allowed) {
      throw new Error("Too many booking attempts. Please try again later.");
    }

    // Validate service & salon
    const { data: service, error: svcErr } = await supabaseAdmin
      .from("services")
      .select("id, name, duration_minutes, buffer_after_minutes, salon_id")
      .eq("id", data.serviceId)
      .eq("salon_id", data.salonId)
      .maybeSingle();
    if (svcErr || !service) throw new Error("Service not found");

    const start = new Date(data.startTime);
    const end = new Date(start.getTime() + service.duration_minutes * 60_000);
    const blockEnd = new Date(end.getTime() + (service.buffer_after_minutes ?? 0) * 60_000);

    // Conflict check (first line — DB exclusion constraint is the real guard)
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

    // Insert booking
    const { data: booking, error: bErr } = await supabaseAdmin
      .from("bookings")
      .insert({
        salon_id: data.salonId,
        service_id: data.serviceId,
        staff_id: data.staffId,
        client_id: clientId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: "confirmed",
      })
      .select("id")
      .single();
    if (bErr || !booking) throw new Error("Could not create booking");

    // ── Notification: Twilio SMS ────────────────────────────────────
    if (phone.startsWith("+")) {
      const { getServerConfig, hasTwilio } = await import("@/lib/config.server");
      if (hasTwilio()) {
        try {
          const { default: twilio } = await import("twilio");
          const cfg = getServerConfig();
          const client = twilio(cfg.twilioAccountSid, cfg.twilioAuthToken);
          const { getSalonName } = await import("@/lib/env");
          const salonName = getSalonName();
          const timeStr = start.toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
          await client.messages.create({
            body: `✅ ${salonName} — your ${service.name} on ${timeStr} is confirmed! Reply or call us to reschedule.`,
            from: cfg.twilioPhoneNumber,
            to: phone,
          });
        } catch (twilioErr) {
          console.error("Twilio SMS failed:", twilioErr);
        }
      }
    }

    // ── Notification: Email (Resend) ─────────────────────────────────
    if (data.clientEmail) {
      const { hasEmail, sendBookingConfirmation } = await import("@/lib/email.server");
      if (hasEmail()) {
        const { getSalonName } = await import("@/lib/env");
        // Fetch staff name for the email
        const { data: staffRow } = await supabaseAdmin
          .from("staff")
          .select("name")
          .eq("id", data.staffId)
          .maybeSingle();
        sendBookingConfirmation({
          to: data.clientEmail,
          salonName: getSalonName(),
          clientName: data.clientName,
          serviceName: service.name,
          staffName: staffRow?.name ?? "",
          startTime: start,
        }).catch((emailErr) => console.error("Email send failed:", emailErr));
      }
    }

    return { bookingId: booking.id };
  });

export const lookupAppointments = createServerFn({ method: "POST" })
  .inputValidator((d) => lookupSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const phone = data.phone.replace(/\s/g, "");
    const { data: rows } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, start_time, end_time, status, services(name, price), staff(name), clients!inner(name, phone, salon_id), salons(name, address)",
      )
      .eq("clients.phone", phone)
      .eq("salons.id", data.salonId)
      .order("start_time", { ascending: false })
      .limit(50);
    return (rows ?? []) as Array<{
      id: string;
      start_time: string;
      end_time: string;
      status: string;
      services: { name: string; price: number } | null;
      staff: { name: string } | null;
      clients: { name: string; phone: string; salon_id: string };
      salons: { name: string; address: string | null } | null;
    }>;
  });

/**
 * Get bookings that need staff completion (completed_at is null but status is "confirmed").
 * Called when staff route mounts to check for pending modal.
 * Only returns bookings from the last 48 hours to prevent old stale data
 * from permanently bricking the staff dashboard.
 */
export const getPendingCompletions = createServerFn({ method: "GET" })
  .inputValidator((d) => staffQuerySchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date();
    const recencyCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const { data: bookings } = await supabaseAdmin
      .from("bookings")
      .select(`id, created_at, start_time, services!inner(name), clients(name)`)
      .eq("staff_id", data.staffId)
      .eq("status", "confirmed")
      .is("completed_at", null)
      .gte("start_time", recencyCutoff.toISOString())
      .lte("start_time", now.toISOString())
      .order("start_time", { ascending: true });

    return (bookings || []) as Array<{
      id: string;
      created_at: string;
      start_time: string;
      services: { name: string };
      clients: { name: string };
    }>;
  });

/**
 * Staff fills in the completion modal — records tip, payment method, notes, marks completed.
 */
export const completeStaffModal = createServerFn({ method: "POST" })
  .inputValidator((d) => completeStaffModalSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Update the booking
    await supabaseAdmin
      .from("bookings")
      .update({
        completed_at: new Date().toISOString(),
        tip_amount: data.tipAmount,
        payment_method: data.paymentMethod,
        service_notes: data.serviceNotes,
        status: "completed",
      })
      .eq("id", data.bookingId);

    // Get booking details for SMS and commission
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("client_phone, start_time, staff_id, salon_id, services(price, name), salons(name)")
      .eq("id", data.bookingId)
      .single();

    if (booking) {
      // Insert commission record
      const price = Number(booking.services?.price ?? 0);
      const net = price;
      const commissionPct = 60;
      const techShare = +((net * commissionPct) / 100).toFixed(2);
      const salonShare = +(net - techShare).toFixed(2);

      await supabaseAdmin.from("commission_records").insert({
        booking_id: data.bookingId,
        staff_id: booking.staff_id,
        salon_id: booking.salon_id,
        gross_amount: price,
        net_amount: net,
        tech_share: techShare,
        salon_share: salonShare,
        tip_amount: data.tipAmount,
        tip_to_tech: data.tipAmount,
        tip_to_salon: 0,
      });

      // Fire-and-forget the rating SMS
      void (async () => {
        try {
          const { sendRatingSms } = await import("./twilio.server");
          const { getSalonName } = await import("./env");
          await sendRatingSms({
            to: booking.client_phone!,
            bookingId: data.bookingId,
            salonName: getSalonName(),
          });

          // Mark that we sent the rating request
          await supabaseAdmin
            .from("bookings")
            .update({ rating_sent_at: new Date().toISOString() })
            .eq("id", data.bookingId);
        } catch (err: unknown) {
          console.error("Booking function error:", err);
        }
      })();
    }

    return { success: true };
  });

/**
 * Get upcoming appointments for a staff member.
 */
export const getStaffAppointments = createServerFn({ method: "GET" })
  .inputValidator((d) => staffQuerySchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("bookings")
      .select("id, start_time, end_time, status, services(name), clients(name, phone)")
      .eq("staff_id", data.staffId)
      .in("status", ["confirmed", "completed"])
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(50);

    return (rows || []).map((b) => ({
      id: b.id,
      start_time: b.start_time,
      end_time: b.end_time,
      status: b.status,
      client_name: b.clients?.name ?? "Unknown",
      service_name: b.services?.name ?? "Unknown",
      client_phone: b.clients?.phone ?? null,
    }));
  });

export const cancelPublicBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => cancelSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const phone = data.phone.replace(/\s/g, "");
    const { data: bk } = await supabaseAdmin
      .from("bookings")
      .select("id, clients!inner(phone, salon_id), salons!inner(id)")
      .eq("id", data.bookingId)
      .eq("salons.id", data.salonId)
      .maybeSingle();
    if (!bk) throw new Error("Booking not found");
    const clientPhone = (bk as { clients: { phone: string } }).clients?.phone;
    if (clientPhone !== phone) throw new Error("Booking not found");
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", data.bookingId);
    if (error) throw new Error("Could not cancel");
    return { ok: true };
  });

/**
 * Fetch booking details for the confirmation page.
 */
export const getBookingDetails = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ bookingId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, start_time, end_time, status, services(id, name, price), staff(id, name), clients(name, phone)",
      )
      .eq("id", data.bookingId)
      .single();

    if (!booking) throw new Error("Booking not found");

    return {
      id: booking.id,
      startTime: booking.start_time,
      endTime: booking.end_time,
      status: booking.status,
      serviceName: booking.services?.name ?? "Unknown",
      servicePrice: booking.services?.price ?? 0,
      staffName: booking.staff?.name ?? "Unknown",
      clientName: booking.clients?.name ?? "Unknown",
      clientPhone: booking.clients?.phone ?? "",
    };
  });
