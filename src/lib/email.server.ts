import process from "node:process";

/**
 * Email integration — uses Resend for transactional email.
 */

export function hasEmail(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendBookingConfirmation(params: {
  to: string;
  salonName: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  startTime: Date;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  if (!apiKey) return;

  const timeStr = params.startTime.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: params.to,
      subject: `✅ ${params.salonName} — Your booking is confirmed!`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="margin-bottom: 4px;">${params.salonName}</h2>
          <p style="color: #666;">Hi ${params.clientName}, your appointment is confirmed.</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; color: #888; font-size: 14px;">Service</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600;">${params.serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888; font-size: 14px;">Staff</td>
              <td style="padding: 8px 0; text-align: right;">${params.staffName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888; font-size: 14px;">Time</td>
              <td style="padding: 8px 0; text-align: right;">${timeStr}</td>
            </tr>
          </table>

          <p style="color: #666; font-size: 14px;">
            Need to reschedule? Call the salon or reply to this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #aaa; font-size: 12px; text-align: center;">
            ${params.salonName}
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Resend email failed:", err);
  }
}
