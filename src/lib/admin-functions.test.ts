import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── Schema definitions (mirrors admin.functions.ts) ──

const createPOSPaymentIntentSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().min(50),
});

const completeBookingWithPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  tipAmount: z.number().min(0),
  tipToTechPercent: z.number().min(0).max(100),
});

// ── Tests ──

describe("createPOSPaymentIntent", () => {
  it("accepts valid input", () => {
    const result = createPOSPaymentIntentSchema.safeParse({
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
      amount: 5000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects amount below 50 (minimum $0.50 in cents)", () => {
    const result = createPOSPaymentIntentSchema.safeParse({
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
      amount: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID bookingId", () => {
    const result = createPOSPaymentIntentSchema.safeParse({
      bookingId: "not-a-uuid",
      amount: 5000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing amount", () => {
    const result = createPOSPaymentIntentSchema.safeParse({
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });
});

describe("completeBookingWithPayment", () => {
  it("accepts valid input", () => {
    const result = completeBookingWithPaymentSchema.safeParse({
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
      tipAmount: 200,
      tipToTechPercent: 100,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative tipAmount", () => {
    const result = completeBookingWithPaymentSchema.safeParse({
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
      tipAmount: -1,
      tipToTechPercent: 50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects tipToTechPercent above 100", () => {
    const result = completeBookingWithPaymentSchema.safeParse({
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
      tipAmount: 0,
      tipToTechPercent: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects tipToTechPercent below 0", () => {
    const result = completeBookingWithPaymentSchema.safeParse({
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
      tipAmount: 0,
      tipToTechPercent: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID bookingId", () => {
    const result = completeBookingWithPaymentSchema.safeParse({
      bookingId: "bad-id",
      tipAmount: 0,
      tipToTechPercent: 50,
    });
    expect(result.success).toBe(false);
  });
});

// ── Schemas not tested (no input validator) ──
//
// getMyStaff           — GET endpoint, no input schema
// linkSelfToFirstSalon — POST endpoint, no input schema
// seedDemoData         — POST endpoint, no input schema
