#!/usr/bin/env node

/**
 * Seed demo data for Nail Lounge
 *
 * Populates: clients (4), floor_status (per active staff),
 * bookings (6 for today), commission_records (2 from completed).
 *
 * Idempotent — deletes existing salon data before inserting.
 * Respects staff working hours and day-of-week availability.
 *
 * Usage:
 *   node scripts/seed-demo.mjs              # dry-run by default
 *   node scripts/seed-demo.mjs --apply      # actually writes
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ────────────────────────────────────────────────────────────

const EXPECTED_PROJECT = "wjyjgtsaepoxtmalttzj";

const SALON_ID = "11111111-1111-1111-1111-111111111111";

const STAFF = [
  { id: "a1111111-1111-1111-1111-111111111111", name: "Mia Tran" },
  { id: "a2222222-2222-2222-2222-222222222222", name: "Linh Pham" },
  { id: "a3333333-3333-3333-3333-333333333333", name: "Sophia Nguyen" },
  { id: "a4444444-4444-4444-4444-444444444444", name: "Anh Le" },
];

// Staff working hours (from DB seed data)
const WORKING_HOURS = {
  "a1111111-1111-1111-1111-111111111111": {
    mon: { open: "10:00", close: "19:00" },
    tue: { open: "10:00", close: "19:00" },
    wed: { open: "10:00", close: "19:00" },
    thu: { open: "10:00", close: "19:00" },
    fri: { open: "10:00", close: "19:00" },
    sat: { open: "10:00", close: "17:00" },
  },
  "a2222222-2222-2222-2222-222222222222": {
    tue: { open: "09:30", close: "18:00" },
    wed: { open: "09:30", close: "18:00" },
    thu: { open: "09:30", close: "18:00" },
    fri: { open: "09:30", close: "19:30" },
    sat: { open: "09:30", close: "18:00" },
    sun: { open: "10:00", close: "17:00" },
  },
  "a3333333-3333-3333-3333-333333333333": {
    mon: { open: "09:30", close: "18:00" },
    wed: { open: "09:30", close: "19:30" },
    thu: { open: "09:30", close: "19:30" },
    fri: { open: "09:30", close: "19:30" },
    sat: { open: "09:30", close: "18:00" },
    sun: { open: "10:00", close: "17:00" },
  },
  "a4444444-4444-4444-4444-444444444444": {
    mon: { open: "11:00", close: "19:30" },
    tue: { open: "11:00", close: "19:30" },
    thu: { open: "11:00", close: "19:30" },
    fri: { open: "11:00", close: "19:30" },
    sat: { open: "10:00", close: "18:00" },
  },
};

// Services to use for bookings (spread across durations/categories)
const BOOKING_SERVICES = [
  { id: "0462505f-bc0d-41e2-bde2-3e4a59d90dbc", name: "Gel Manicure", duration: 45, buffer: 5 },
  { id: "4f1c40ec-88b2-40df-8251-82a33f277d54", name: "Spa Pedicure", duration: 55, buffer: 10 },
  {
    id: "5a3286ca-0cbe-436c-8ac0-e6f73538f766",
    name: "Acrylic Full Set",
    duration: 75,
    buffer: 10,
  },
  { id: "6716d6c9-1d48-415e-a33c-a97efb457667", name: "Deluxe Manicure", duration: 60, buffer: 10 },
  { id: "c8995ac8-8c88-4754-9eb4-2078d5c80ce1", name: "Mani-Pedi Combo", duration: 75, buffer: 10 },
  { id: "16f4877f-ac1c-4218-839d-c98d063aa3cd", name: "Spa Manicure", duration: 45, buffer: 5 },
];

const CLIENTS = [
  { name: "Sarah Johnson", phone: "+18155551234", email: "sarah@example.com" },
  { name: "Jessica Williams", phone: "+18155555678", email: "jessica@example.com" },
  { name: "Emily Davis", phone: "+18155559012", email: "emily@example.com" },
  { name: "Ashley Martinez", phone: "+18155553456", email: "ashley@example.com" },
];

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// ─── Helpers ───────────────────────────────────────────────────────────

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

function dayKey(date) {
  return DAY_KEYS[date.getDay()];
}

function parseHM(date, hm) {
  const [h, m] = hm.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function fmtTime(d) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  const isDryRun = !process.argv.includes("--apply");
  if (isDryRun) {
    console.log("🔍 DRY RUN — pass --apply to actually write data\n");
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

  // Safety: verify project ID
  if (!supabaseUrl.includes(EXPECTED_PROJECT)) {
    console.error(`❌ SUPABASE_URL doesn't match expected project "${EXPECTED_PROJECT}"`);
    console.error(`   URL: ${supabaseUrl}`);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── Today ──────────────────────────────────────────────────────────
  const today = new Date();
  const todayKey = dayKey(today);
  console.log(`📅 Today: ${today.toDateString()} (${todayKey})\n`);

  // ── 1. Cleanup (delete old data for this salon, FK-safe order) ──
  console.log("🧹 Step 1: Cleanup existing data for salon…");
  if (!isDryRun) {
    const { error: e1 } = await supabase
      .from("commission_records")
      .delete()
      .eq("salon_id", SALON_ID);
    if (e1) console.error("   cleanup commission_records:", e1.message);

    const { error: e2 } = await supabase.from("bookings").delete().eq("salon_id", SALON_ID);
    if (e2) console.error("   cleanup bookings:", e2.message);

    // Also delete waitlist entries (if any)
    const { error: e3 } = await supabase.from("waitlist_entries").delete().eq("salon_id", SALON_ID);
    if (e3 && !e3.message.includes("does not exist")) {
      console.error("   cleanup waitlist_entries:", e3.message);
    }

    const { error: e4 } = await supabase.from("clients").delete().eq("salon_id", SALON_ID);
    if (e4) console.error("   cleanup clients:", e4.message);

    const { error: e5 } = await supabase.from("floor_status").delete().eq("salon_id", SALON_ID);
    if (e5) console.error("   cleanup floor_status:", e5.message);
  }
  console.log("   ✅ Cleanup done\n");

  // ── 2. Seed clients ────────────────────────────────────────────────
  console.log("👤 Step 2: Seed clients…");
  const clientIds = [];
  for (const c of CLIENTS) {
    if (!isDryRun) {
      const { data, error } = await supabase
        .from("clients")
        .upsert(
          { salon_id: SALON_ID, name: c.name, phone: c.phone, email: c.email },
          { onConflict: "salon_id, phone", ignoreDuplicates: false },
        )
        .select("id")
        .single();
      if (error) {
        console.error(`   ❌ client ${c.name}: ${error.message}`);
        continue;
      }
      clientIds.push(data.id);
    } else {
      clientIds.push(`dry-run-id-${c.name.replace(/\s/g, "")}`);
    }
    console.log(`   ✅ ${c.name} (${c.phone})`);
  }
  console.log(`   → ${clientIds.length} clients ready\n`);

  // ── 3. Seed floor_status ───────────────────────────────────────────
  console.log("🛋️ Step 3: Seed floor status…");
  for (const s of STAFF) {
    if (!isDryRun) {
      const { error } = await supabase.from("floor_status").upsert(
        {
          salon_id: SALON_ID,
          staff_id: s.id,
          status: "available",
        },
        { onConflict: "staff_id", ignoreDuplicates: false },
      );
      if (error) console.error(`   ❌ floor ${s.name}: ${error.message}`);
    }
    console.log(`   ✅ ${s.name} → available`);
  }
  console.log("");

  // ── 4. Determine available staff today ────────────────────────────
  console.log("👷 Step 4: Check staff availability for today…");
  const availableStaff = [];
  for (const s of STAFF) {
    const wh = WORKING_HOURS[s.id]?.[todayKey];
    if (wh) {
      availableStaff.push({ ...s, hours: wh });
      console.log(`   ✅ ${s.name}: ${wh.open}–${wh.close}`);
    } else {
      console.log(`   ⛔ ${s.name}: off today`);
    }
  }

  if (availableStaff.length === 0) {
    console.error("❌ No staff available today — cannot seed bookings");
    process.exit(1);
  }
  console.log(`   → ${availableStaff.length} staff available\n`);

  // ── 5. Generate bookings ──────────────────────────────────────────
  console.log("📅 Step 5: Generate 6 bookings…");

  // Start at 10:00 or the earliest staff open time, whichever is later
  let baseHour = 10;
  for (const s of availableStaff) {
    const h = parseInt(s.hours.open.split(":")[0], 10);
    if (h > baseHour) baseHour = h;
  }

  const bookingRows = [];
  const commissionRows = [];

  // We have 6 services, 6 clients, and need to distribute across available staff
  // Use a round-robin to spread across staff, with 90-min gaps on same staff
  const staffNextSlot = {};
  for (const s of availableStaff) {
    staffNextSlot[s.id] = new Date(today);
    staffNextSlot[s.id].setHours(baseHour, 0, 0, 0);
  }

  for (let i = 0; i < 6; i++) {
    const svc = BOOKING_SERVICES[i];
    const clientIdx = i % CLIENTS.length;
    const staffIdx = i % availableStaff.length;
    const staff = availableStaff[staffIdx];
    const sid = staff.id;

    // Compute the start time for this staff member
    let start = new Date(staffNextSlot[sid]);

    // Make sure it's within working hours
    const openTime = parseHM(today, staff.hours.open);
    const closeTime = parseHM(today, staff.hours.close);
    const blockEndTime = new Date(start.getTime() + (svc.duration + svc.buffer) * 60_000);

    // If this slot extends past close, skip (don't push this service to this staff)
    if (blockEndTime > closeTime) {
      // Try next staff member
      const nextStaffIdx = (staffIdx + 1) % availableStaff.length;
      const nextStaff = availableStaff[nextStaffIdx];
      const nextSid = nextStaff.id;
      start = new Date(Math.max(staffNextSlot[nextSid].getTime(), openTime.getTime()));
      const nextBlockEnd = new Date(start.getTime() + (svc.duration + svc.buffer) * 60_000);
      if (nextBlockEnd <= parseHM(today, nextStaff.hours.close)) {
        // Use this staff instead
        staffNextSlot[nextSid] = new Date(nextBlockEnd.getTime() + 15 * 60_000);
        const end = new Date(start.getTime() + svc.duration * 60_000);
        bookingRows.push({ start, end, staff: nextStaff, svc, clientIdx, sid: nextSid });
      }
      continue;
    }

    const end = new Date(start.getTime() + svc.duration * 60_000);
    staffNextSlot[sid] = new Date(blockEndTime.getTime() + 15 * 60_000); // 15min gap after block

    bookingRows.push({ start, end, staff, svc, clientIdx, sid });
  }

  if (bookingRows.length === 0) {
    console.error("❌ Could not generate any bookings within working hours");
    process.exit(1);
  }

  // Sort by start time
  bookingRows.sort((a, b) => a.start - b.start);

  // Print booking plan
  for (const b of bookingRows) {
    console.log(`   📌 ${b.svc.name} — ${b.staff.name} — ${fmtTime(b.start)}–${fmtTime(b.end)}`);
  }
  console.log(`   → ${bookingRows.length} bookings planned\n`);

  // ── 6. Insert bookings ────────────────────────────────────────────
  console.log("💾 Step 6: Insert bookings…");

  const insertedBookingIds = [];

  for (const b of bookingRows) {
    const clientId = clientIds[b.clientIdx];
    if (!clientId) {
      console.error(`   ❌ No client ID for index ${b.clientIdx}, skipping`);
      continue;
    }

    const bookingRecord = {
      salon_id: SALON_ID,
      service_id: b.svc.id,
      staff_id: b.sid,
      client_id: clientId,
      start_time: b.start.toISOString(),
      end_time: b.end.toISOString(),
      status: "confirmed",
      deposit_paid: 10,
    };

    if (!isDryRun) {
      const { data, error } = await supabase
        .from("bookings")
        .insert(bookingRecord)
        .select("id")
        .single();

      if (error) {
        console.error(`   ❌ Booking ${b.svc.name}/${b.staff.name}: ${error.message}`);
        continue;
      }
      insertedBookingIds.push(data.id);
    } else {
      insertedBookingIds.push(`dry-run-booking-${insertedBookingIds.length + 1}`);
    }
    console.log(`   ✅ ${b.svc.name} — ${b.staff.name} (${fmtTime(b.start)})`);
  }
  console.log(`   → ${insertedBookingIds.length} bookings inserted\n`);

  // ── 7. Insert commission records for first 2 bookings ─────────────
  console.log("💰 Step 7: Seed commission records (first 2 completed bookings)…");

  for (let i = 0; i < Math.min(2, insertedBookingIds.length); i++) {
    const b = bookingRows[i];
    const price =
      b.svc.name === "Gel Manicure"
        ? 40
        : b.svc.name === "Spa Pedicure"
          ? 50
          : b.svc.name === "Acrylic Full Set"
            ? 45
            : b.svc.name === "Deluxe Manicure"
              ? 48
              : b.svc.name === "Mani-Pedi Combo"
                ? 45
                : b.svc.name === "Spa Manicure"
                  ? 38
                  : 40;

    const net = price;
    const commissionPct = 60;
    const techShare = +((net * commissionPct) / 100).toFixed(2);
    const salonShare = +(net - techShare).toFixed(2);

    if (!isDryRun) {
      const { error } = await supabase.from("commission_records").insert({
        salon_id: SALON_ID,
        booking_id: insertedBookingIds[i],
        staff_id: b.sid,
        gross_amount: price,
        net_amount: net,
        tech_share: techShare,
        salon_share: salonShare,
        tip_amount: 0,
        tip_to_tech: 0,
        tip_to_salon: 0,
      });
      if (error) {
        console.error(`   ❌ Commission ${i + 1}: ${error.message}`);
        continue;
      }
    }
    console.log(`   ✅ Booking ${i + 1} commission: $${price} service, $${techShare} tech share`);
  }
  console.log("");

  // ── 8. Also mark the first 2 bookings as completed ────────────────
  if (!isDryRun && insertedBookingIds.length >= 2) {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "completed" })
      .in("id", [insertedBookingIds[0], insertedBookingIds[1]]);
    if (error) console.error("   ⚠️  Could not mark bookings as completed:", error.message);
    else console.log("   ✅ First 2 bookings marked as completed\n");
  }

  // ── 9. Verify ─────────────────────────────────────────────────────
  console.log("🔎 Step 8: Verification — counting rows…");

  async function count(table) {
    if (isDryRun) return "(dry-run)";
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("salon_id", SALON_ID);
    return error ? `error: ${error.message}` : count;
  }

  console.log(`   clients:           ${await count("clients")}`);
  console.log(`   floor_status:      ${await count("floor_status")}`);
  console.log(`   bookings:          ${await count("bookings")}`);
  console.log(`   commission_records: ${await count("commission_records")}`);
  console.log("");

  // ── Done ─────────────────────────────────────────────────────────
  if (isDryRun) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 DRY RUN complete. No data was written.");
    console.log("   Run with --apply to actually seed data.");
  } else {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Seed complete!");
    console.log("   Bookings for today are ready in the DB.");
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
