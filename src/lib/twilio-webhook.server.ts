import { handleRatingReply } from "./twilio.server";

/**
 * Handle incoming Twilio SMS replies (rating responses).
 * This is called from src/server.ts before TanStack Start handles the request,
 * allowing us to parse the form-encoded body that Twilio sends.
 */
export async function handleTwilioWebhook(request: Request): Promise<Response> {
  const text = await request.text();
  const params = new URLSearchParams(text);

  const from = params.get("From") || params.get("from") || "";
  const body = params.get("Body") || params.get("body") || "";

  if (!from) {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      },
    );
  }

  // Look up the booking by phone number where rating_sent_at IS NOT NULL AND client_rating IS NULL
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: booking } = await (supabaseAdmin as any)
    .from("bookings")
    .select("id")
    .eq("client_phone", from)
    .is("client_rating", null)
    .not("rating_sent_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!booking) {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      },
    );
  }

  const { getSalonPhone } = await import("@/lib/env");

  await handleRatingReply({
    from,
    body,
    bookingId: booking.id,
    salonPhone: getSalonPhone(),
  });

  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    },
  );
}
