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

    // Ensure the auth user exists in auth.users before we create a staff record
    // referencing it — the foreign key constraint requires it.
    // Handles the dev bypass where the user may not exist yet.
    const { error: notFound } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (notFound) {
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        id: context.userId,
        email: context.claims?.email || "owner@nail-lounge.dev",
        email_confirm: true,
        user_metadata: { full_name: "Owner" },
      });
      if (createError) throw createError;
    }

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
