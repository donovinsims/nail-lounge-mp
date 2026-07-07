import process from "node:process";

// Server-only config. The .server.ts suffix prevents Vite from bundling
// this file into the client — values here never reach the browser.
//
// On Cloudflare Workers, env binds at REQUEST time. Module-scope reads
// (e.g. `const x = process.env.X`) resolve to undefined — always read
// process.env INSIDE a function or handler.
//
// When to use which env-access pattern:
//   - .server.ts module (this file): server-only helpers reused across
//     handlers. Wrap reads in a function so they run per-request.
//   - inline process.env inside a createServerFn handler: one-off reads
//     not reused elsewhere.
//   - import.meta.env.VITE_FOO: PUBLIC config readable from both client
//     and server (analytics IDs, public URLs). Define in .env with the
//     VITE_ prefix. Never put secrets here — they ship to the browser.

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
    appUrl: process.env.APP_URL || import.meta.env.VITE_APP_URL || "",
    resendApiKey: process.env.RESEND_API_KEY || "",
    resendFromEmail: process.env.RESEND_FROM_EMAIL || "",
  };
}

/** High-convenience check — true when Twilio is ready to send SMS. */
export function hasTwilio(): boolean {
  const cfg = getServerConfig();
  return !!(cfg.twilioAccountSid && cfg.twilioAuthToken && cfg.twilioPhoneNumber);
}

/** High-convenience check — true when Resend is ready to send email. */
export function hasEmail(): boolean {
  const cfg = getServerConfig();
  return !!cfg.resendApiKey;
}
