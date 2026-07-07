import { describe, it, expect } from "vitest";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Schemas (replicated from booking.functions.ts)
// ---------------------------------------------------------------------------

const PHONE_RE = /^\+?[0-9\s\-()]{7,20}$/;

const createBookingSchema = z.object({
  salonId: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  startTime: z.string(),
  clientName: z.string().trim().min(1).max(100),
  clientPhone: z.string().regex(PHONE_RE),
  clientEmail: z.string().email().optional().or(z.literal("")),
  depositPaid: z.number().min(0),
});

const lookupSchema = z.object({
  phone: z.string().regex(PHONE_RE),
  salonId: z.string().uuid(),
});

const cancelSchema = z.object({
  bookingId: z.string().uuid(),
  phone: z.string().regex(PHONE_RE),
  salonId: z.string().uuid(),
});

const verifySchema = z.object({
  sessionId: z.string(),
});

// ---------------------------------------------------------------------------
// Shared valid data
// ---------------------------------------------------------------------------

const validBookingData = {
  salonId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  serviceId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  staffId: "c3d4e5f6-a7b8-9012-cdef-123456789012",
  startTime: "2026-06-18T10:00:00Z",
  clientName: "Jane Doe",
  clientPhone: "+1 555-123-4567",
  clientEmail: "jane@example.com",
  depositPaid: 25.0,
};

// ---------------------------------------------------------------------------
// createBookingSchema
// ---------------------------------------------------------------------------

describe("createBookingSchema", () => {
  it("accepts valid input with all fields", () => {
    const result = createBookingSchema.safeParse(validBookingData);
    expect(result.success).toBe(true);
  });

  it("accepts valid input without email (email optional)", () => {
    const { clientEmail: _, ...noEmail } = validBookingData;
    const result = createBookingSchema.safeParse(noEmail);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with empty email", () => {
    const result = createBookingSchema.safeParse({
      ...validBookingData,
      clientEmail: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID for salonId", () => {
    const result = createBookingSchema.safeParse({
      ...validBookingData,
      salonId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty clientName", () => {
    const result = createBookingSchema.safeParse({
      ...validBookingData,
      clientName: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects clientName over 100 chars", () => {
    const result = createBookingSchema.safeParse({
      ...validBookingData,
      clientName: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid phone format (letters)", () => {
    const result = createBookingSchema.safeParse({
      ...validBookingData,
      clientPhone: "abc-def-ghij",
    });
    expect(result.success).toBe(false);
  });

  it("rejects phone too short (<7 chars)", () => {
    const result = createBookingSchema.safeParse({
      ...validBookingData,
      clientPhone: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = createBookingSchema.safeParse({
      ...validBookingData,
      clientEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative depositPaid", () => {
    const result = createBookingSchema.safeParse({
      ...validBookingData,
      depositPaid: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects string value for depositPaid (no coercion)", () => {
    const result = createBookingSchema.safeParse({
      ...validBookingData,
      depositPaid: "25",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// lookupSchema
// ---------------------------------------------------------------------------

describe("lookupSchema", () => {
  it("accepts valid lookup data", () => {
    const result = lookupSchema.safeParse({
      phone: "+1 555-123-4567",
      salonId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid phone", () => {
    const result = lookupSchema.safeParse({
      phone: "abc",
      salonId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID salonId", () => {
    const result = lookupSchema.safeParse({
      phone: "+1 555-123-4567",
      salonId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// cancelSchema
// ---------------------------------------------------------------------------

describe("cancelSchema", () => {
  it("accepts valid cancel data", () => {
    const result = cancelSchema.safeParse({
      bookingId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      phone: "+1 555-123-4567",
      salonId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID bookingId", () => {
    const result = cancelSchema.safeParse({
      bookingId: "not-a-uuid",
      phone: "+1 555-123-4567",
      salonId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// verifySchema
// ---------------------------------------------------------------------------

describe("verifySchema", () => {
  it("accepts valid sessionId string", () => {
    const result = verifySchema.safeParse({
      sessionId: "cs_test_a1b2c3d4e5f6",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing sessionId", () => {
    const result = verifySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
