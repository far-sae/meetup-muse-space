import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { bookingId } = await req.json();
    if (!bookingId) {
      throw new Error("bookingId is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    // Fetch meeting link from admin settings
    const { data: meetingSetting } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "default_meeting_link")
      .limit(1)
      .maybeSingle();

    const meetingLink = meetingSetting?.setting_value || null;

    // Update booking with meeting link if available
    if (meetingLink) {
      await supabase
        .from("bookings")
        .update({ meeting_link: meetingLink })
        .eq("id", bookingId);
    }

    // Format date and time
    const dateObj = new Date(booking.booking_date + "T00:00:00");
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeParts = booking.booking_time.split(":");
    const formattedTime = `${timeParts[0]}:${timeParts[1]}`;

    const meetingSection = meetingLink
      ? `
        <tr>
          <td style="padding: 16px 24px; background: #1a2e1a; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 8px; color: #a3e635; font-weight: 600; font-size: 14px;">📹 Video Meeting Link</p>
            <a href="${meetingLink}" style="color: #a3e635; font-size: 16px; word-break: break-all;">${meetingLink}</a>
          </td>
        </tr>
        `
      : "";

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; background-color:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#141414; border-radius:12px; border: 1px solid #262626;">
              <tr>
                <td style="padding: 32px 24px; text-align: center; border-bottom: 1px solid #262626;">
                  <h1 style="margin:0; color:#a3e635; font-size: 24px;">✅ Interview Confirmed!</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px;">
                  <p style="color:#d4d4d4; margin: 0 0 20px; font-size: 16px;">
                    Hi <strong style="color:#fff;">${booking.candidate_name}</strong>, your interview has been successfully scheduled.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1c1c1c; border-radius:8px; border: 1px solid #262626;">
                    <tr>
                      <td style="padding: 16px 20px; border-bottom: 1px solid #262626;">
                        <span style="color:#737373; font-size:13px;">📅 Date</span><br/>
                        <span style="color:#fff; font-size:15px; font-weight:600;">${formattedDate}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 16px 20px; border-bottom: 1px solid #262626;">
                        <span style="color:#737373; font-size:13px;">🕐 Time</span><br/>
                        <span style="color:#fff; font-size:15px; font-weight:600;">${formattedTime}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 16px 20px;">
                        <span style="color:#737373; font-size:13px;">💼 Role</span><br/>
                        <span style="color:#fff; font-size:15px; font-weight:600;">${booking.role_applied}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${meetingSection}
              <tr>
                <td style="padding: 24px; text-align: center; border-top: 1px solid #262626;">
                  <p style="color:#737373; font-size: 13px; margin: 0;">
                    If you need to reschedule, please contact us directly.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "InterviewBook <onboarding@resend.dev>",
        to: [booking.candidate_email],
        subject: `Interview Confirmed — ${formattedDate} at ${formattedTime}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();
    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      throw new Error(`Email sending failed: ${JSON.stringify(resendData)}`);
    }

    return new Response(
      JSON.stringify({ success: true, meetingLink }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
