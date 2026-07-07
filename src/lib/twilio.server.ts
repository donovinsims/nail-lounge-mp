import twilio from "twilio";
import { getServerConfig } from "./config.server";

/**
 * Send a 1-5 rating SMS to a client after their appointment is completed.
 * Called from booking.functions.ts when staff completes a booking.
 */
export async function sendRatingSms(params: {
  to: string;
  bookingId: string;
  salonName: string;
}): Promise<{ success: boolean }> {
  const config = getServerConfig();
  if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
    return { success: false };
  }

  const client = twilio(config.twilioAccountSid, config.twilioAuthToken);

  await client.messages.create({
    body: `How was your visit to ${params.salonName}? Reply with a number 1-5 (1=poor, 5=amazing).`,
    to: params.to,
    from: config.twilioPhoneNumber,
  });

  return { success: true };
}

/**
 * Handle an incoming Twilio SMS reply (rating response).
 * Called from the webhook endpoint.
 * Body is the "1-5" text the client replied with.
 *
 * Every rating receives the same public-review invitation — the ask is never
 * gated on the score (selectively soliciting reviews from happy customers
 * violates Google review policies and the FTC rule on consumer reviews,
 * 16 CFR Part 465). Low ratings (1-3) additionally trigger an apology and an
 * owner alert so the salon can follow up personally.
 */
export async function handleRatingReply(params: {
  from: string;
  body: string;
  bookingId: string;
  salonPhone: string;
}): Promise<{ success: boolean; rating?: number }> {
  const config = getServerConfig();
  const rating = parseInt(params.body.trim(), 10);

  // Validate rating is 1-5
  if (isNaN(rating) || rating < 1 || rating > 5) {
    // Invalid — send a clarifying message back
    if (config.twilioAccountSid && config.twilioAuthToken && config.twilioPhoneNumber) {
      const client = twilio(config.twilioAccountSid, config.twilioAuthToken);
      await client.messages.create({
        body: `Sorry, we didn't recognize that. Please reply with a number 1-5 (1=poor, 5=amazing).`,
        to: params.from,
        from: config.twilioPhoneNumber,
      });
    }
    return { success: false };
  }

  // Update the booking with the rating
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("bookings").update({ client_rating: rating }).eq("id", params.bookingId);

  const hasTwilioCreds = Boolean(
    config.twilioAccountSid && config.twilioAuthToken && config.twilioPhoneNumber,
  );
  // Same review invitation for every rating — never conditioned on the score.
  const reviewInvite = config.googleReviewUrl
    ? ` If you have a moment, we'd appreciate an honest review: ${config.googleReviewUrl}`
    : "";

  if (rating >= 4) {
    // High rating — thank the client
    if (hasTwilioCreds) {
      const client = twilio(config.twilioAccountSid, config.twilioAuthToken);
      await client.messages.create({
        body: `Thank you! We're so glad you enjoyed your visit.${reviewInvite}`,
        to: params.from,
        from: config.twilioPhoneNumber,
      });
    }
  } else {
    // Low rating (1-3) — apologize + notify owner for personal follow-up
    if (hasTwilioCreds) {
      const client = twilio(config.twilioAccountSid, config.twilioAuthToken);
      // Apology to client (same review invitation as every other rating)
      await client.messages.create({
        body: `We're sorry your visit didn't meet expectations. The owner will follow up personally to make it right.${reviewInvite}`,
        to: params.from,
        from: config.twilioPhoneNumber,
      });
      // Alert the owner
      await client.messages.create({
        body: `⚠️ Low rating alert: A client rated their visit ${rating}/5. Booking: ${params.bookingId}. Please follow up.`,
        to: params.salonPhone,
        from: config.twilioPhoneNumber,
      });
    }

    // Record the alert in the owner_alerts table
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("client_phone")
      .eq("id", params.bookingId)
      .single();

    await supabaseAdmin.from("owner_alerts").insert({
      booking_id: params.bookingId,
      client_phone: booking?.client_phone || params.from,
      rating,
    });
  }

  return { success: true, rating };
}
