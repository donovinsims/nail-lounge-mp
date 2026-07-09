import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getSalonId } from "@/lib/env";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AuthContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
  claims?: { email?: string };
  devBypass?: boolean;
};

export const getMyStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!context) throw new Error("No auth context");
    const ctx = context as AuthContext;

    // Dev bypass: look up any staff record for the configured salon
    if (ctx.devBypass) {
      const salonId = getSalonId();
      if (!salonId) throw new Error("SALON_ID not configured");
      const { data: staff } = await ctx.supabase
        .from("staff")
        .select("id, name, role, salon_id, salons(*)")
        .eq("salon_id", salonId)
        .limit(1)
        .maybeSingle();
      return staff;
    }
    const { data: staff } = await ctx.supabase
      .from("staff")
      .select("id, name, role, salon_id, salons(*)")
      .eq("auth_user_id", ctx.userId)
      .maybeSingle();
    return staff;
  });

export const linkSelfToFirstSalon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!context) throw new Error("No auth context");
    const ctx = context as AuthContext;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const salonId = getSalonId();
    if (!salonId) throw new Error("SALON_ID not configured — set VITE_SALON_ID in .env");

    // Dev bypass: check if any staff record exists for the salon
    if (ctx.devBypass) {
      const { data: existing } = await supabaseAdmin
        .from("staff")
        .select("id")
        .eq("salon_id", salonId)
        .limit(1)
        .maybeSingle();
      if (existing) return { ok: true, already: true };
    } else {
      const { data: existing } = await ctx.supabase
        .from("staff")
        .select("id")
        .eq("auth_user_id", ctx.userId)
        .maybeSingle();
      if (existing) return { ok: true, already: true };
    }

    // Ensure the auth user exists in auth.users before we create a staff record
    // referencing it — the foreign key constraint requires it.
    const { error: notFound } = await supabaseAdmin.auth.admin.getUserById(ctx.userId);
    if (notFound) {
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        id: ctx.userId,
        email: ctx.claims?.email || "owner@nail-lounge.dev",
        email_confirm: true,
        user_metadata: { full_name: "Owner" },
      });
      if (createError) throw createError;
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", ctx.userId)
      .maybeSingle();
    await supabaseAdmin.from("staff").insert({
      salon_id: salonId,
      auth_user_id: ctx.userId,
      name: profile?.full_name || profile?.email || "Owner",
      role: "owner",
      working_hours: {},
    });
    return { ok: true, linked: true };
  });
