import { describe, it, expect, afterEach } from "vitest";
import {
  getSalonName,
  getSalonNameShort,
  getSalonAddress,
  getSalonPhone,
  getSalonPhoneHref,
  getSalonTagline,
  getOGImage,
  getSalonSocial,
  getAppUrl,
  getUmamiWebsiteId,
  getUmamiHost,
  getSalonId,
} from "./env";

describe("env defaults", () => {
  it("getSalonName returns default name", () => {
    expect(getSalonName()).toBe("Your Salon Name");
  });

  it("getSalonNameShort returns initials", () => {
    expect(getSalonNameShort()).toBe("YS");
  });

  it("getSalonAddress returns empty string", () => {
    expect(getSalonAddress()).toBe("");
  });

  it("getSalonPhone returns empty string", () => {
    expect(getSalonPhone()).toBe("");
  });

  it("getSalonPhoneHref strips non-digits", () => {
    expect(getSalonPhoneHref()).toBe("");
  });

  it("getSalonTagline returns default tagline", () => {
    expect(getSalonTagline()).toBe("Precision nail care");
  });

  it("getOGImage returns empty string", () => {
    expect(getOGImage()).toBe("");
  });

  it("getSalonSocial returns all empty fields", () => {
    const social = getSalonSocial();
    expect(social).toEqual({
      email: "",
      mapsUrl: "",
      mapEmbed: "",
      instagram: "",
      facebook: "",
      tiktok: "",
      booksy: "",
      yelp: "",
    });
  });

  it("getAppUrl returns empty string", () => {
    expect(getAppUrl()).toBe("");
  });

  it("getUmamiWebsiteId returns empty string", () => {
    expect(getUmamiWebsiteId()).toBe("");
  });

  it("getUmamiHost returns default Umami Cloud URL", () => {
    expect(getUmamiHost()).toBe("https://cloud.umami.is");
  });
});

describe("getSalonId", () => {
  afterEach(() => {
    delete process.env.VITE_SALON_ID;
  });

  it("returns the salon ID from env", async () => {
    process.env.VITE_SALON_ID = "11111111-1111-1111-1111-111111111111";
    const { getSalonId: get } = await import("./env");
    expect(get()).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("returns undefined when no env set", async () => {
    const { getSalonId: get } = await import("./env");
    expect(get()).toBeUndefined();
  });
});

describe("isSeedAllowed", () => {
  afterEach(() => {
    delete process.env.VITE_ALLOW_SEED_DATA;
  });

  it("returns false when no env set", async () => {
    const { isSeedAllowed: check } = await import("./env");
    expect(check()).toBe(false);
  });

  it("returns true when VITE_ALLOW_SEED_DATA is true", async () => {
    process.env.VITE_ALLOW_SEED_DATA = "true";
    const { isSeedAllowed: check } = await import("./env");
    expect(check()).toBe(true);
  });

  it("returns false when VITE_ALLOW_SEED_DATA is false", async () => {
    process.env.VITE_ALLOW_SEED_DATA = "false";
    const { isSeedAllowed: check } = await import("./env");
    expect(check()).toBe(false);
  });
});
