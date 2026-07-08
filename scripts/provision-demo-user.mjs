#!/usr/bin/env node

/**
 * Provision demo user for Nail Lounge admin access.
 *
 * Creates a Supabase Auth user (auto-confirmed), profile, and staff
 * row linked as owner of the first salon.
 *
 * Usage:
 *   node scripts/provision-demo-user.mjs   # dry-run
 *   node scripts/provision-demo-user.mjs --apply   # write to Supabase
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEMO_EMAIL = "emaildonovin@gmail.com";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "changeme123!";
const DEMO_NAME = "Donovin (Demo)";
const SALON_ID = "11111111-1111-1111-1111-111111111111";
const EXPECTED_PROJECT = "wjyjgtsaepoxtmalttzj";

function parseEnv(filepath) {
  const text = readFileSync(filepath, "utf-8");
  const env = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    let val = trimmed.slice(eq + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[trimmed.slice(0, eq)] = val;
  }
  return env;
}

async function main() {
  const isDryRun = !process.argv.includes("--apply");
  if (isDryRun) {
    console.log("🔍 DRY RUN — pass --apply to create the user\n");
  } else {
    console.log("⚡ APPLY MODE — writing to Supabase\n");
  }

  // Read env
  const env = parseEnv(resolve(__dirname, "..", ".env"));
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  if (!supabaseUrl.includes(EXPECTED_PROJECT)) {
    console.error(`❌ SUPABASE_URL doesn't match expected project "${EXPECTED_PROJECT}"`);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Step 1: Create or find Supabase Auth user ────────────────────
  console.log("📧 Step 1: Creating Supabase Auth user…");

  let userId;

  if (!isDryRun) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_NAME },
    });

    if (error) {
      // Check if user already exists
      if (
        error.message?.includes("already exists") ||
        error.message?.includes("already been registered") ||
        error.status === 409
      ) {
        console.log("   ℹ️  User already exists in Auth. Looking up by email…");
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          console.error("   ❌ Could not list users:", listError.message);
          process.exit(1);
        }
        const existing = existingUsers.users.find((u) => u.email === DEMO_EMAIL);
        if (!existing) {
          console.error(`   ❌ User ${DEMO_EMAIL} not found despite creation error`);
          process.exit(1);
        }
        userId = existing.id;
        console.log(`   ✅ Found existing user: ${userId} (profile/staff will be updated)`);
      } else {
        console.error("   ❌ Failed to create auth user:", error.message);
        process.exit(1);
      }
    } else {
      userId = data.user.id;
      console.log(`   ✅ Created auth user: ${userId}`);
    }
  } else {
    userId = "dry-run-user-id";
    console.log(`   📋 Would create user: ${DEMO_EMAIL}`);
  }

  // ── Step 2: Create/upsert profile ─────────────────────────────────
  console.log("\n👤 Step 2: Creating profile…");

  if (!isDryRun) {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email: DEMO_EMAIL,
        full_name: DEMO_NAME,
      },
      { onConflict: "id", ignoreDuplicates: false },
    );
    if (error) {
      console.error("   ❌ Failed to create profile:", error.message);
      process.exit(1);
    }
    console.log("   ✅ Profile created/updated");
  } else {
    console.log("   📋 Would create profile for user");
  }

  // ── Step 3: Link as staff/owner of first salon ───────────────────
  console.log("\n🔗 Step 3: Linking as salon owner…");

  if (!isDryRun) {
    // Check if already linked
    const { data: existingStaff } = await supabase
      .from("staff")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (existingStaff) {
      console.log("   ℹ️  Already linked to salon (staff row exists)");
    } else {
      const { error } = await supabase.from("staff").insert({
        salon_id: SALON_ID,
        auth_user_id: userId,
        name: DEMO_NAME,
        role: "owner",
        working_hours: {},
        is_active: true,
      });
      if (error) {
        console.error("   ❌ Failed to link staff:", error.message);
        process.exit(1);
      }
      console.log("   ✅ Staff row created with role=owner");
    }
  } else {
    console.log("   📋 Would create staff row: salon_owner");
  }

  // ── Done ──────────────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (isDryRun) {
    console.log("🔍 DRY RUN complete. No data was written.");
    console.log("   Run with --apply to provision the user.");
  } else {
    console.log("✅ Demo user provisioned!");
    console.log(`   Email: ${DEMO_EMAIL}`);
    console.log(`   Password: ${DEMO_PASSWORD}`);
    console.log("\n   Sign in at /auth, then visit /admin");
    console.log("   All admin features will be available.");
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
