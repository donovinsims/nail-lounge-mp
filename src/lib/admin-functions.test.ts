import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── Schema definitions (mirrors production server functions) ──

const completeStaffModalSchema = z.object({
  bookingId: z.string().uuid(),
  tipAmount: z.number().min(0).default(0),
  paymentMethod: z.enum(["Credit/Debit", "Cash", "Venmo", "Cash App"]),
  serviceNotes: z.string().default(""),
});

const staffQuerySchema = z.object({
  staffId: z.string(),
});

// ── Tests ──

describe("completeStaffModalSchema", () => {
  it("accepts valid input", () => {
    const result = completeStaffModalSchema.safeParse({
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
      tipAmount: 15.0,
      paymentMethod: "Cash",
      serviceNotes: "Great service",
    });
    expect(result.success).toBe(true);
  });

  it("defaults tipAmount to 0 when omitted", () => {
    const result = completeStaffModalSchema.safeParse({
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
      paymentMethod: "Credit/Debit",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tipAmount).toBe(0);
    }
  });

  it("defaults serviceNotes to empty string when omitted", () => {
    const result = completeStaffModalSchema.safeParse({
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
      paymentMethod: "Venmo",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.serviceNotes).toBe("");
    }
  });

  it("rejects negative tipAmount", () => {
    const result = completeStaffModalSchema.safeParse({
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
      tipAmount: -1,
      paymentMethod: "Cash",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid payment method", () => {
    const result = completeStaffModalSchema.safeParse({
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
      tipAmount: 0,
      paymentMethod: "Bitcoin",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID bookingId", () => {
    const result = completeStaffModalSchema.safeParse({
      bookingId: "not-a-uuid",
      tipAmount: 0,
      paymentMethod: "Cash App",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing bookingId", () => {
    const result = completeStaffModalSchema.safeParse({
      paymentMethod: "Cash",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing paymentMethod", () => {
    const result = completeStaffModalSchema.safeParse({
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });
});

describe("staffQuerySchema", () => {
  it("accepts valid staffId", () => {
    const result = staffQuerySchema.safeParse({
      staffId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing staffId", () => {
    const result = staffQuerySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ── Other admin functions (no input schema to validate) ──
//
// getMyStaff           — GET endpoint, no input schema
// linkSelfToFirstSalon — POST endpoint, no input schema
// seedDemoData         — POST endpoint, no input schema
