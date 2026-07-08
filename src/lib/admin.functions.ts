import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getSalonId } from "@/lib/env";

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
