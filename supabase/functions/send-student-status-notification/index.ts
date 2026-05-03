import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const APP_URL = (Deno.env.get("APP_URL") ?? "https://iams-nine.vercel.app").replace(/\/$/, "");
  const FROM_ADDRESS = Deno.env.get("FROM_EMAIL") ?? "IAMS <onboarding@resend.dev>";

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
      headers: { ...cors, "Content-Type": "application/json" }, status: 500,
    });
  }

  const { studentId, status, studentName, reason } = await req.json();

  if (!studentId || !status) {
    return new Response(JSON.stringify({ error: "studentId and status are required" }), {
      headers: { ...cors, "Content-Type": "application/json" }, status: 400,
    });
  }

  // Get student email from auth
  const { data: authUser } = await supabase.auth.admin.getUserById(studentId);
  const studentEmail = authUser?.user?.email;

  if (!studentEmail) {
    return new Response(JSON.stringify({ error: "Student email not found" }), {
      headers: { ...cors, "Content-Type": "application/json" }, status: 404,
    });
  }

  const name = studentName ?? "Student";
  const dashboardUrl = `${APP_URL}/student/dashboard`;
  const preferencesUrl = `${APP_URL}/student/preferences`;

  const isRejected = status === "rejected";

  const subject = isRejected
    ? `\u26a0\ufe0f IAMS Application Update \u2014 Action Required`
    : `\u2705 IAMS Application Status Update`;

  const stripColor = isRejected ? "#fef2f2" : "#f0fdf4";
  const stripBorder = isRejected ? "#fecaca" : "#bbf7d0";
  const stripTextColor = isRejected ? "#991b1b" : "#166534";
  const stripEmoji = isRejected ? "\u26a0\ufe0f" : "\u2705";
  const stripLabel = isRejected ? "Application Not Successful" : "Application Status Updated";

  const bodyContent = isRejected
    ? `
      <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">After reviewing your application, we regret to inform you that your industrial attachment application has <strong style="color:#dc2626;">not been accepted</strong> at this time.</p>
      ${reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:20px;"><p style="margin:0;font-size:13px;color:#991b1b;"><strong>Reason:</strong> ${reason}</p></div>` : ""}
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">Please update your profile and preferences, then contact your coordinator to discuss your options.</p>
      <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td style="background:#0f172a;border-radius:12px;"><a href="${preferencesUrl}" style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:800;color:#fff;text-decoration:none;">Update My Preferences \u2192</a></td></tr></table>
      <p style="font-size:12px;color:#94a3b8;">You can contact your coordinator at <a href="mailto:coordinator@ub.ac.bw" style="color:#3b82f6;">coordinator@ub.ac.bw</a> for further guidance.</p>
    `
    : `
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">Your industrial attachment application status has been updated to <strong>${status}</strong>. Log in to your portal to see more details.</p>
      <table cellpadding="0" cellspacing="0"><tr><td style="background:#0f172a;border-radius:12px;"><a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:800;color:#fff;text-decoration:none;">View Dashboard \u2192</a></td></tr></table>
    `;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;"><tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
<tr><td style="background:#0f172a;padding:28px 40px;"><p style="margin:0;font-size:26px;font-weight:900;color:#fff;">IAMS</p><p style="margin:4px 0 0;font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:3px;">Industrial Attachment Portal \u00b7 University of Botswana</p></td></tr>
<tr><td style="background:${stripColor};border-bottom:1px solid ${stripBorder};padding:14px 40px;"><p style="margin:0;font-size:11px;font-weight:900;color:${stripTextColor};text-transform:uppercase;letter-spacing:2px;">${stripEmoji} ${stripLabel}</p></td></tr>
<tr><td style="padding:36px 40px;">
  <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;">Hi ${name} \ud83d\udc4b</h1>
  ${bodyContent}
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid #e2e8f0;"><p style="margin:0;font-size:11px;color:#94a3b8;">This is an automated notification from IAMS regarding your industrial attachment application at the University of Botswana.</p></td></tr>
</table></td></tr></table></body></html>`;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [studentEmail], subject, html }),
  });

  if (!resendRes.ok) {
    const err = await resendRes.json();
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...cors, "Content-Type": "application/json" }, status: 500,
    });
  }

  const resendData = await resendRes.json();
  console.log(`Status notification sent \u2192 ${studentEmail} (status: ${status})`);

  return new Response(
    JSON.stringify({ success: true, emailId: resendData.id }),
    { headers: { ...cors, "Content-Type": "application/json" }, status: 200 }
  );
});
