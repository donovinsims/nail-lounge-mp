import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getServerConfig, hasTwilio, hasEmail } from "./config.server";

const ENV_KEYS = [
  "NODE_ENV",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "APP_URL",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
] as const;

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {};
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

function restoreEnv(): void {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
}

afterEach(() => {
  restoreEnv();
});

describe("getServerConfig", () => {
  it("returns defaults when no env vars are set", () => {
    const cfg = getServerConfig();

    expect(cfg.twilioAccountSid).toBe("");
    expect(cfg.twilioAuthToken).toBe("");
    expect(cfg.twilioPhoneNumber).toBe("");
    expect(cfg.resendApiKey).toBe("");
    expect(cfg.resendFromEmail).toBe("");
    // nodeEnv may be "test" or undefined depending on runner
    // appUrl may be undefined/empty in node test env without VITE_APP_URL
  });

  it("reads env vars", () => {
    process.env.TWILIO_ACCOUNT_SID = "ACxxx";
    process.env.TWILIO_AUTH_TOKEN = "tok_abc";
    process.env.TWILIO_PHONE_NUMBER = "+15551234567";
    process.env.APP_URL = "https://app.example.com";
    process.env.RESEND_API_KEY = "re_abc";
    process.env.RESEND_FROM_EMAIL = "nails@example.com";
    process.env.NODE_ENV = "production";

    const cfg = getServerConfig();

    expect(cfg.twilioAccountSid).toBe("ACxxx");
    expect(cfg.twilioAuthToken).toBe("tok_abc");
    expect(cfg.twilioPhoneNumber).toBe("+15551234567");
    expect(cfg.appUrl).toBe("https://app.example.com");
    expect(cfg.resendApiKey).toBe("re_abc");
    expect(cfg.resendFromEmail).toBe("nails@example.com");
    expect(cfg.nodeEnv).toBe("production");
  });
});

describe("hasTwilio", () => {
  it("returns false when not configured", () => {
    expect(hasTwilio()).toBe(false);
  });

  it("returns true when all three Twilio env vars are set", () => {
    process.env.TWILIO_ACCOUNT_SID = "ACxxx";
    process.env.TWILIO_AUTH_TOKEN = "tok_abc";
    process.env.TWILIO_PHONE_NUMBER = "+15551234567";
    expect(hasTwilio()).toBe(true);
  });
});

describe("hasEmail", () => {
  it("returns false when RESEND_API_KEY not set", () => {
    expect(hasEmail()).toBe(false);
  });

  it("returns true when RESEND_API_KEY is set", () => {
    process.env.RESEND_API_KEY = "re_abc";
    expect(hasEmail()).toBe(true);
  });
});
