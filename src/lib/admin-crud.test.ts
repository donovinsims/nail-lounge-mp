import { describe, it, expect } from "vitest";

// Schemas imported from the source module — tests validate the real thing,
// not replicas (replicas silently drift from production behavior).
import {
  createStaffSchema,
  updateStaffSchema,
  deleteStaffSchema,
  createServiceSchema,
  updateServiceSchema,
  updateSalonHoursSchema,
} from "./admin-crud.functions";

describe("createStaff", () => {
  it("accepts valid input (name only, rest get defaults)", () => {
    const result = createStaffSchema.safeParse({ name: "Alice" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Alice");
      expect(result.data.role).toBe("staff");
      expect(result.data.workingHours).toEqual({});
      expect(result.data.avatarColor).toBe("#0a0a0a");
    }
  });

  it("accepts explicit role and workingHours", () => {
    const result = createStaffSchema.safeParse({
      name: "Bob",
      role: "owner",
      workingHours: { monday: { start: "09:00", end: "17:00" } },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Bob");
      expect(result.data.role).toBe("owner");
      expect(result.data.workingHours).toEqual({ monday: { start: "09:00", end: "17:00" } });
    }
  });

  it("rejects empty name", () => {
    const result = createStaffSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 chars", () => {
    const result = createStaffSchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role (not owner or staff)", () => {
    const result = createStaffSchema.safeParse({ name: "Charlie", role: "manager" });
    expect(result.success).toBe(false);
  });
});

describe("updateStaff", () => {
  it("accepts valid partial update (id + name only)", () => {
    const result = updateStaffSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Alice Updated",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Alice Updated");
      expect(result.data.role).toBeUndefined();
      expect(result.data.isActive).toBeUndefined();
    }
  });

  it("accepts all optional fields", () => {
    const result = updateStaffSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Alice",
      role: "owner",
      workingHours: { tuesday: { start: "10:00", end: "18:00" } },
      isActive: false,
      avatarColor: "#ff0000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(false);
      expect(result.data.avatarColor).toBe("#ff0000");
    }
  });

  it("rejects missing id", () => {
    const result = updateStaffSchema.safeParse({ name: "No ID" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid id (non-UUID)", () => {
    const result = updateStaffSchema.safeParse({
      id: "not-a-uuid",
      name: "Bad ID",
    });
    expect(result.success).toBe(false);
  });
});

describe("createService", () => {
  it("accepts valid input (name, durationMinutes, price)", () => {
    const result = createServiceSchema.safeParse({
      name: "Classic Manicure",
      durationMinutes: 30,
      price: 25,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Classic Manicure");
      expect(result.data.durationMinutes).toBe(30);
      expect(result.data.price).toBe(25);
      expect(result.data.bufferAfterMinutes).toBe(0);
    }
  });

  it("accepts with all optional fields", () => {
    const result = createServiceSchema.safeParse({
      name: "Gel Manicure",
      category: "Nails",
      durationMinutes: 45,
      price: 40,
      bufferAfterMinutes: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("Nails");
      expect(result.data.bufferAfterMinutes).toBe(5);
    }
  });

  it("rejects empty name", () => {
    const result = createServiceSchema.safeParse({
      name: "",
      durationMinutes: 30,
      price: 25,
    });
    expect(result.success).toBe(false);
  });

  it("rejects duration too low (<5)", () => {
    const result = createServiceSchema.safeParse({
      name: "Quick File",
      durationMinutes: 2,
      price: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects duration too high (>480)", () => {
    const result = createServiceSchema.safeParse({
      name: "Marathon Session",
      durationMinutes: 500,
      price: 200,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = createServiceSchema.safeParse({
      name: "Freebie",
      durationMinutes: 15,
      price: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateService", () => {
  it("accepts valid partial update (id + price only)", () => {
    const result = updateServiceSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      price: 35,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(35);
      expect(result.data.name).toBeUndefined();
    }
  });

  it("rejects missing id", () => {
    const result = updateServiceSchema.safeParse({ price: 50 });
    expect(result.success).toBe(false);
  });
});

describe("updateSalonHours", () => {
  it("accepts valid businessHours record", () => {
    const result = updateSalonHoursSchema.safeParse({
      businessHours: {
        monday: { open: "09:00", close: "18:00" },
        tuesday: { open: "09:00", close: "18:00" },
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.businessHours.monday.open).toBe("09:00");
      expect(result.data.holidaySchedule).toBeUndefined();
    }
  });

  it("accepts with holidaySchedule", () => {
    const result = updateSalonHoursSchema.safeParse({
      businessHours: {
        wednesday: { open: "10:00", close: "16:00" },
      },
      holidaySchedule: [{ date: "2026-12-25", name: "Christmas Day", closed: true }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.holidaySchedule).toHaveLength(1);
      expect(result.data!.holidaySchedule![0].date).toBe("2026-12-25");
    }
  });
});
