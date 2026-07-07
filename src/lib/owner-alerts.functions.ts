import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getOwnerAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: alerts, error } = await context.supabase
      .from("owner_alerts")
      .select("id, client_phone, rating, acknowledged_at, created_at, booking_id")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return (alerts || []) as Array<{
      id: string;
      client_phone: string;
      rating: number;
      acknowledged_at: string | null;
      created_at: string;
      booking_id: string;
    }>;
  });

export const acknowledgeAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ alertId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("owner_alerts")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", data.alertId);

    return { success: true };
  });

export interface CustomerHistoryEntry {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  completedVisits: number;
  totalSpent: number;
  totalTips: number;
  lastVisit: string | null;
  lastStaff: string | null;
  lastService: string | null;
  lastNotes: string | null;
  lastRating: number | null;
}

type CrmBookingRow = {
  id: string;
  client_id: string;
  start_time: string;
  completed_at: string | null;
  status: string;
  tip_amount: number | null;
  payment_method: string | null;
  service_notes: string | null;
  client_rating: number | null;
  services: { name: string; price: number } | null;
  staff: { name: string } | null;
};

export const getCustomerHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CustomerHistoryEntry[]> => {
    const { data: clients, error: clientErr } = await context.supabase
      .from("clients")
      .select("id, name, phone")
      .order("name")
      .limit(100);

    if (clientErr) throw clientErr;
    if (!clients || clients.length === 0) return [];

    const { data: bookings, error: bookingErr } = await context.supabase
      .from("bookings")
      .select(
        `
        id, client_id, start_time, completed_at, status, tip_amount,
        payment_method, service_notes, client_rating,
        services:service_id(name, price),
        staff:staff_id(name)
      `,
      )
      .in(
        "client_id",
        clients.map((c) => c.id),
      )
      .order("start_time", { ascending: false });

    if (bookingErr) throw bookingErr;
    const bks = (bookings || []) as CrmBookingRow[];

    return clients.map((client: { id: string; name: string; phone: string }) => {
      const clientBookings = bks.filter((b) => b.client_id === client.id);
      const completed = clientBookings.filter((b) => b.status === "completed");
      const totalSpent = completed.reduce((s, b) => s + (b.services?.price || 0), 0);
      const totalTips = completed.reduce((s, b) => s + (b.tip_amount || 0), 0);
      const lastBooking = clientBookings.length > 0 ? clientBookings[0] : null;
      const lastRated = [...clientBookings].reverse().find((b) => b.client_rating != null);

      return {
        id: client.id,
        name: client.name,
        phone: client.phone,
        totalVisits: clientBookings.length,
        completedVisits: completed.length,
        totalSpent,
        totalTips,
        lastVisit: lastBooking?.start_time ?? null,
        lastStaff: lastBooking?.staff?.name ?? null,
        lastService: lastBooking?.services?.name ?? null,
        lastNotes: lastBooking?.service_notes ?? null,
        lastRating: lastRated?.client_rating ?? null,
      };
    });
  });
