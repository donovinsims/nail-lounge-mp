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

const completeStaffModalSchema = z.object({
  bookingId: z.string().uuid(),
  tipAmount: z.number().min(0).default(0),
  paymentMethod: z.enum(["Credit/Debit", "Cash", "Venmo", "Cash App"]),
  serviceNotes: z.string().default(""),
});

const staffQuerySchema = z.object({
  staffId: z.string(),
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
};

const validStaffModalData = {
  bookingId: "d4e5f6a7-b8c9-0123-defa-1234567890ab",
  tipAmount: 15.0,
  paymentMethod: "Cash" as const,
  serviceNotes: "Great client, requested extra shaping",
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
// completeStaffModalSchema
// ---------------------------------------------------------------------------

describe("completeStaffModalSchema", () => {
  it("accepts valid completion data", () => {
    const result = completeStaffModalSchema.safeParse(validStaffModalData);
    expect(result.success).toBe(true);
  });

  it("accepts zero tip amount", () => {
    const result = completeStaffModalSchema.safeParse({
      ...validStaffModalData,
      tipAmount: 0,
    });
    expect(result.success).toBe(true);
  });

  it("accepts all payment methods", () => {
    for (const method of ["Credit/Debit", "Cash", "Venmo", "Cash App"] as const) {
      const result = completeStaffModalSchema.safeParse({
        ...validStaffModalData,
        paymentMethod: method,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid payment method", () => {
    const result = completeStaffModalSchema.safeParse({
      ...validStaffModalData,
      paymentMethod: "Bitcoin",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative tip amount", () => {
    const result = completeStaffModalSchema.safeParse({
      ...validStaffModalData,
      tipAmount: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID bookingId", () => {
    const result = completeStaffModalSchema.safeParse({
      ...validStaffModalData,
      bookingId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("defaults tipAmount to 0 when missing", () => {
    const { tipAmount: _, ...withoutTip } = validStaffModalData;
    const result = completeStaffModalSchema.safeParse(withoutTip);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tipAmount).toBe(0);
    }
  });

  it("defaults serviceNotes to empty string when missing", () => {
    const { serviceNotes: _, ...withoutNotes } = validStaffModalData;
    const result = completeStaffModalSchema.safeParse(withoutNotes);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.serviceNotes).toBe("");
    }
  });
});

// ---------------------------------------------------------------------------
// staffQuerySchema (used by getPendingCompletions, getStaffAppointments)
// ---------------------------------------------------------------------------

describe("staffQuerySchema", () => {
  it("accepts valid staffId string", () => {
    const result = staffQuerySchema.safeParse({ staffId: "some-staff-id" });
    expect(result.success).toBe(true);
  });

  it("accepts UUID staffId", () => {
    const result = staffQuerySchema.safeParse({
      staffId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing staffId", () => {
    const result = staffQuerySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts non-empty staffId string", () => {
    const result = staffQuerySchema.safeParse({ staffId: "abc" });
    expect(result.success).toBe(true);
  });
});
