/**
 * Client-safe environment variable access.
 *
 * Everything here uses `import.meta.env.VITE_*` so it works on both
 * client and server (TanStack Start SSR). For server-only secrets
 * (service-role key, etc.) use config.server.ts instead.
 */

export interface SalonSocialConfig {
  email: string;
  mapsUrl: string;
  mapEmbed: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  yelp: string;
}

export function getSalonId(): string | undefined {
  return import.meta.env.VITE_SALON_ID ?? process.env.VITE_SALON_ID;
}

export function getSalonName(): string {
  return import.meta.env.VITE_SALON_NAME || "Your Salon Name";
}

export function getSalonNameShort(): string {
  const name = getSalonName();
  // Return initials for collapsed nav
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getSalonAddress(): string {
  return import.meta.env.VITE_SALON_ADDRESS || "";
}

export function getSalonPhone(): string {
  return import.meta.env.VITE_SALON_PHONE || "";
}

export function getSalonPhoneHref(): string {
  return getSalonPhone().replace(/[^+\d]/g, "");
}

export function getSalonTagline(): string {
  return import.meta.env.VITE_SALON_TAGLINE || "Precision nail care";
}

export function getOGImage(): string {
  return import.meta.env.VITE_OG_IMAGE || "";
}

export function getSalonSocial(): SalonSocialConfig {
  return {
    email: import.meta.env.VITE_SALON_EMAIL || "",
    mapsUrl: import.meta.env.VITE_SALON_MAPS_URL || "",
    mapEmbed: import.meta.env.VITE_SALON_MAP_EMBED || "",
    instagram: import.meta.env.VITE_SALON_INSTAGRAM || "",
    facebook: import.meta.env.VITE_SALON_FACEBOOK || "",
    tiktok: import.meta.env.VITE_SALON_TIKTOK || "",
    yelp: import.meta.env.VITE_SALON_YELP || "",
  };
}

export function getAppUrl(): string {
  return import.meta.env.VITE_APP_URL || "";
}

export function getTwilioPhone(): string {
  // Only the Twilio phone number is safe to expose client-side
  return import.meta.env.VITE_TWILIO_PHONE_NUMBER || "";
}

/**
 * Returns true when VITE_ALLOW_SEED_DATA env var is explicitly "true".
 * Useful as a safety override for development environments.
 */
export function isSeedAllowed(): boolean {
  return (
    import.meta.env.VITE_ALLOW_SEED_DATA === "true" || process.env.VITE_ALLOW_SEED_DATA === "true"
  );
}

/** Umami website ID for analytics tracking. Empty = no analytics. */
export function getUmamiWebsiteId(): string {
  return import.meta.env.VITE_UMAMI_WEBSITE_ID || "";
}

/** Umami host (defaults to Umami Cloud CDN). Override for self-hosted. */
export function getUmamiHost(): string {
  return import.meta.env.VITE_UMAMI_HOST || "https://cloud.umami.is";
}
