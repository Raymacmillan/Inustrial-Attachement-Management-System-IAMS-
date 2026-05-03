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
  // For testing without verified domain — send to Resend account owner instead
  const TEST_EMAIL_OVERRIDE = Deno.env.get("TEST_EMAIL_OVERRIDE") ?? "";

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
      headers: { ...cors, "Content-Type": "application/json" }, status: 500,
    });
  }

  const { placementId, visitNumber, visitDate, supervisorId, comments } = await req.json();

  if (!placementId || !visitNumber || !visitDate) {
    return new Response(JSON.stringify({ error: "placementId, visitNumber, visitDate required" }), {
      headers: { ...cors, "Content-Type": "application/json" }, status: 400,
    });
  }

  const { data: placement, error: pErr } = await supabase
    .from("placements")
    .select(`id, student_id, position_title, student_profiles(full_name, student_id), organization_profiles(org_name, location)`)
    .eq("id", placementId)
    .single();

  if (pErr || !placement) {
    return new Response(JSON.stringify({ error: "Placement not found" }), {
      headers: { ...cors, "Content-Type": "application/json" }, status: 404,
    });
  }

  const { data: supervisor } = await supabase
    .from("university_supervisors")
    .select("full_name, department")
    .eq("id", supervisorId)
    .maybeSingle();

  // Get student email
  const { data: authUser } = await supabase.auth.admin.getUserById(placement.student_id);
  const studentEmail = TEST_EMAIL_OVERRIDE || authUser?.user?.email;

  if (!studentEmail) {
    return new Response(JSON.stringify({ error: "Student email not found", studentId: placement.student_id }), {
      headers: { ...cors, "Content-Type": "application/json" }, status: 404,
    });
  }

  const studentName = (placement.student_profiles as any)?.full_name ?? "Student";
  const orgName = (placement.organization_profiles as any)?.org_name ?? "your organisation";
  const orgLocation = (placement.organization_profiles as any)?.location ?? "";
  const supervisorName = supervisor?.full_name ?? "Your University Supervisor";
  const supervisorDept = supervisor?.department ?? "Computer Science";
  const formattedDate = new Date(visitDate).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const logbookUrl = `${APP_URL}/student/logbook`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;"><tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
<tr><td style="background:#0f172a;padding:28px 40px;"><p style="margin:0;font-size:26px;font-weight:900;color:#fff;">IAMS</p><p style="margin:4px 0 0;font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:3px;">Industrial Attachment Portal \u00b7 University of Botswana</p></td></tr>
<tr><td style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:14px 40px;"><p style="margin:0;font-size:11px;font-weight:900;color:#1e40af;text-transform:uppercase;letter-spacing:2px;">\ud83d\udcc5 Supervisor Visit ${visitNumber} Scheduled</p></td></tr>
<tr><td style="padding:36px 40px;">
<h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;">Hi ${studentName} \ud83d\udc4b</h1>
<p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">Your university supervisor has scheduled <strong>Visit ${visitNumber}</strong> to your placement at <strong>${orgName}</strong>.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;"><tr><td style="padding:20px;">
<p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Visit Date</p>
<p style="margin:0 0 16px;font-size:16px;font-weight:800;color:#0f172a;">${formattedDate}</p>
<p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Supervisor</p>
<p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0f172a;">${supervisorName}</p>
<p style="margin:0 0 ${comments ? '16px' : '0'};font-size:12px;color:#64748b;">${supervisorDept} \u00b7 University of Botswana</p>
${comments ? `<p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Notes from Supervisor</p><p style="margin:0;font-size:13px;color:#475569;">${comments}</p>` : ""}
</td></tr></table>
<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">Please ensure your logbook entries are complete and up to date before the visit.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#0f172a;border-radius:12px;"><a href="${logbookUrl}" style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:800;color:#fff;text-decoration:none;">Update My Logbook \u2192</a></td></tr></table>
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid #e2e8f0;"><p style="margin:0;font-size:11px;color:#94a3b8;">This is an automated notification from IAMS. Your university supervisor has scheduled a site visit to ${orgName}.</p></td></tr>
</table></td></tr></table></body></html>`;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [studentEmail], subject: `\ud83d\udcc5 Visit ${visitNumber} scheduled for ${formattedDate} — IAMS`, html }),
  });

  const resendData = await resendRes.json();

  if (!resendRes.ok) {
    console.error("Resend error:", JSON.stringify(resendData));
    // Return 200 anyway — the visit was saved, email failure is non-fatal
    return new Response(JSON.stringify({ success: false, emailError: resendData.message ?? resendData, studentEmail }), {
      headers: { ...cors, "Content-Type": "application/json" }, status: 200,
    });
  }

  console.log(`Visit notification sent \u2192 ${studentEmail} (Visit ${visitNumber})`);
  return new Response(
    JSON.stringify({ success: true, emailId: resendData.id, studentEmail }),
    { headers: { ...cors, "Content-Type": "application/json" }, status: 200 }
  );
});
