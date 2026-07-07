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
