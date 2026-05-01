import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")            ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const APP_URL        = Deno.env.get("APP_URL") ?? "https://iams-nine.vercel.app";

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY secret is not configured.");
    }

    const { invitationId } = await req.json();
    if (!invitationId) throw new Error("invitationId is required.");

    // Fetch the invitation row
    const { data: inv, error: invError } = await supabase
      .from("supervisor_invitations")
      .select(`
        id, token, email, supervisor_type, status, expires_at,
        org_id,
        organization_profiles:org_id ( org_name ),
        invited_by
      `)
      .eq("id", invitationId)
      .single();

    if (invError || !inv) throw new Error("Invitation not found.");
    if (inv.status !== "pending")  throw new Error("Invitation is no longer pending.");
    if (new Date(inv.expires_at) < new Date()) throw new Error("Invitation has expired.");

    // Fetch inviter name
    const { data: inviterProfile } = await supabase
      .from("student_profiles")
      .select("full_name")
      .eq("id", inv.invited_by)
      .maybeSingle();

    const inviterName  = inviterProfile?.full_name ?? "The IAMS Coordinator";
    const orgName      = inv.organization_profiles?.org_name ?? "the organisation";
    const roleLabel    = inv.supervisor_type === "industrial_supervisor"
      ? "Industrial Supervisor"
      : "University Supervisor";
    const registrationLink = `${APP_URL}/register/supervisor?token=${inv.token}`;
    const expiryDate = new Date(inv.expires_at).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });

    // Build email HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>IAMS Supervisor Invitation</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:32px 40px;">
              <p style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-1px;text-transform:uppercase;">
                IAMS
              </p>
              <p style="margin:4px 0 0;font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:3px;">
                Industrial Attachment Portal · University of Botswana
              </p>
            </td>
          </tr>

          <!-- Role badge -->
          <tr>
            <td style="background:#f0f9ff;padding:16px 40px;border-bottom:1px solid #e2e8f0;">
              <span style="display:inline-block;background:#0ea5e9;color:#ffffff;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;padding:4px 12px;border-radius:100px;">
                ${roleLabel}
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#0f172a;line-height:1.3;">
                You've been invited to IAMS
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">
                ${inviterName} has invited you to join the Industrial Attachment Management System
                as a <strong style="color:#0f172a;">${roleLabel}</strong>${inv.supervisor_type === "industrial_supervisor" ? ` at <strong style="color:#0f172a;">${orgName}</strong>` : ""}.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#475569;line-height:1.7;">
                Click the button below to create your account and access the supervisor portal.
                This link expires on <strong style="color:#0f172a;">${expiryDate}</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#0f172a;border-radius:12px;">
                    <a href="${registrationLink}"
                       style="display:inline-block;padding:16px 32px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">
                      Accept Invitation →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">
                Or copy this link into your browser:<br/>
                <span style="color:#0ea5e9;word-break:break-all;">${registrationLink}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;">
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                This invitation was sent by the IAMS system on behalf of ${inviterName}.
                If you were not expecting this email, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        from:    "IAMS <noreply@iams.ub.ac.bw>",
        to:      [inv.email],
        subject: `You've been invited as a ${roleLabel} — IAMS`,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const err = await resendResponse.json();
      throw new Error(`Resend error: ${err.message || JSON.stringify(err)}`);
    }

    return new Response(
      JSON.stringify({ success: true, email: inv.email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});