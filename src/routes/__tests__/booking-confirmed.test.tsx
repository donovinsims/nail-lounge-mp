import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Schemas and components imported from the source module — tests validate the
// real thing, not replicas (replicas silently drift from production behavior).
// ---------------------------------------------------------------------------

import { searchSchema } from "../booking-confirmed";
import { DetailRow } from "../../components/booking-detail-row";

// ---------------------------------------------------------------------------
// searchSchema (validates ?bookingId= in the URL)
// ---------------------------------------------------------------------------

describe("booking-confirmed searchSchema", () => {
  it("accepts a valid UUID bookingId", () => {
    const result = searchSchema.safeParse({
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bookingId).toBe("550e8400-e29b-41d4-a716-446655440000");
    }
  });

  it("rejects a non-UUID bookingId", () => {
    const result = searchSchema.safeParse({ bookingId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing bookingId", () => {
    const result = searchSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects an empty-string bookingId", () => {
    const result = searchSchema.safeParse({ bookingId: "" });
    expect(result.success).toBe(false);
  });

  it("strips extra whitespace from bookingId", () => {
    // UUID parse still fails because whitespace-padded string is not a uuid
    const result = searchSchema.safeParse({
      bookingId: "  550e8400-e29b-41d4-a716-446655440000  ",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DetailRow helper component (pure presentational, no hooks)
// ---------------------------------------------------------------------------

describe("DetailRow", () => {
  it("returns a div element", () => {
    const el = DetailRow({ label: "Service", value: "Manicure" }) as React.ReactElement<{
      children: React.ReactNode;
    }>;
    expect(el).toBeDefined();
    expect(el.type).toBe("div");
  });

  it("renders the label text in a <span>", () => {
    const el = DetailRow({ label: "Date", value: "Mon, Jan 1" }) as React.ReactElement<{
      children: [React.ReactElement, React.ReactElement];
    }>;
    const [labelSpan] = el.props.children;
    expect(labelSpan.type).toBe("span");
    expect((labelSpan.props as { children: string }).children).toBe("Date");
  });

  it("renders the value text in a <span>", () => {
    const el = DetailRow({ label: "Price", value: "$50" }) as React.ReactElement<{
      children: [React.ReactElement, React.ReactElement];
    }>;
    const [, valueSpan] = el.props.children;
    expect(valueSpan.type).toBe("span");
    expect((valueSpan.props as { children: string }).children).toBe("$50");
  });

  it("renders long label and value strings", () => {
    const el = DetailRow({
      label: "Service Description",
      value: "Deluxe Gel Manicure with Nail Art",
    }) as React.ReactElement<{ children: [React.ReactElement, React.ReactElement] }>;
    const [labelSpan, valueSpan] = el.props.children;
    expect((labelSpan.props as { children: string }).children).toBe("Service Description");
    expect((valueSpan.props as { children: string }).children).toBe(
      "Deluxe Gel Manicure with Nail Art",
    );
  });
});
