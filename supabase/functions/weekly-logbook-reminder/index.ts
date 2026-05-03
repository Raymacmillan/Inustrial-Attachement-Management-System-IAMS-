import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * US-06: Weekly Logbook Reminder
 * ─────────────────────────────────────────────────────────────────────────────
 * Triggered every Monday at 05:00 UTC (07:00 Gaborone time, UTC+2) by pg_cron.
 *
 * Logic:
 *  1. Find all active placements that are currently in progress
 *     (start_date <= today <= end_date).
 *  2. For each placement, calculate which week number "last week" was.
 *  3. Check if a logbook_weeks row exists for that week AND has been submitted
 *     (submitted_at IS NOT NULL).
 *  4. If NOT submitted → send a reminder email to the student.
 *
 * The cron job SQL to add in Supabase Dashboard → Database → Extensions → pg_cron:
 *   SELECT cron.schedule(
 *     'weekly-logbook-reminder',
 *     '0 5 * * 1',   -- Every Monday at 05:00 UTC
 *     $$
 *       SELECT net.http_post(
 *         url := 'https://<PROJECT_REF>.supabase.co/functions/v1/weekly-logbook-reminder',
 *         headers := '{"Content-Type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
 *         body := '{}'::jsonb
 *       ) AS request_id;
 *     $$
 *   );
 *
 * Required Supabase secrets (already set):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, APP_URL
 */

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")             ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const APP_URL        = (Deno.env.get("APP_URL") ?? "https://iams-nine.vercel.app").replace(/\/$/, "");
  const FROM_ADDRESS   = Deno.env.get("FROM_EMAIL") ?? "IAMS <onboarding@resend.dev>";

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY secret is not configured." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }

  const today    = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Calculate last Monday's date (the start of the week we're reminding about)
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - 7);
  const lastMondayStr = lastMonday.toISOString().split("T")[0];

  // ── 1. Fetch all active placements in progress ─────────────────────────────
  const { data: placements, error: pErr } = await supabase
    .from("placements")
    .select(`
      id,
      start_date,
      end_date,
      duration_weeks,
      student_id,
      student_profiles (
        full_name,
        student_id
      ),
      organization_profiles (
        org_name
      )
    `)
    .eq("status", "active")
    .lte("start_date", todayStr)
    .gte("end_date",   todayStr);

  if (pErr) {
    console.error("Placement fetch error:", pErr.message);
    return new Response(
      JSON.stringify({ error: pErr.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }

  const results = {
    processed: 0,
    reminded:  0,
    skipped:   0,
    errors:    [] as string[],
  };

  for (const placement of placements ?? []) {
    results.processed++;

    try {
      // ── 2. Work out which week number last week was ────────────────────────
      const placementStart = new Date(placement.start_date);
      const daysSinceStart = Math.floor(
        (lastMonday.getTime() - placementStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      const weekNumber = Math.floor(daysSinceStart / 7) + 1;

      // Skip if we're before the attachment started or past it
      if (weekNumber < 1 || weekNumber > (placement.duration_weeks ?? 8)) {
        results.skipped++;
        continue;
      }

      // ── 3. Check logbook submission status for that week ───────────────────
      const { data: weekRow } = await supabase
        .from("logbook_weeks")
        .select("id, status, submitted_at")
        .eq("placement_id", placement.id)
        .eq("week_number", weekNumber)
        .maybeSingle();

      // If submitted (has submitted_at) → no reminder needed
      if (weekRow?.submitted_at) {
        results.skipped++;
        continue;
      }

      // ── 4. Get student email from auth ─────────────────────────────────────
      const { data: authUser } = await supabase.auth.admin.getUserById(placement.student_id);
      const studentEmail = authUser?.user?.email;

      if (!studentEmail) {
        results.errors.push(`No email for student_id ${placement.student_id}`);
        continue;
      }

      const studentName = (placement.student_profiles as any)?.full_name ?? "Student";
      const orgName     = (placement.organization_profiles as any)?.org_name ?? "your organisation";
      const logbookUrl  = `${APP_URL}/student/logbook`;
      const weekStatus  = weekRow ? "started but not submitted" : "not yet started";

      // ── 5. Send reminder email via Resend ─────────────────────────────────
      const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>IAMS Logbook Reminder</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr><td style="background:#0f172a;padding:28px 40px;">
          <p style="margin:0;font-size:26px;font-weight:900;color:#fff;letter-spacing:-1px;">IAMS</p>
          <p style="margin:4px 0 0;font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:3px;">
            Industrial Attachment Portal · University of Botswana
          </p>
        </td></tr>

        <!-- Alert strip -->
        <tr><td style="background:#fef3c7;border-bottom:1px solid #fde68a;padding:14px 40px;">
          <p style="margin:0;font-size:11px;font-weight:900;color:#92400e;text-transform:uppercase;letter-spacing:2px;">
            ⏰ Logbook Reminder — Week ${weekNumber}
          </p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;">
            Hi ${studentName} 👋
          </h1>
          <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
            Your <strong style="color:#0f172a;">Week ${weekNumber}</strong> logbook for your attachment
            at <strong style="color:#0f172a;">${orgName}</strong> is currently
            <strong style="color:#d97706;">${weekStatus}</strong>.
          </p>
          <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
            Please submit it as soon as possible so your industrial supervisor can
            review and approve your progress for the week.
          </p>

          <!-- CTA button -->
          <table cellpadding="0" cellspacing="0">
            <tr><td style="background:#0f172a;border-radius:12px;">
              <a href="${logbookUrl}"
                style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:800;
                  color:#fff;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">
                Submit Logbook →
              </a>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
            Or copy this link:<br/>
            <a href="${logbookUrl}" style="color:#3b82f6;word-break:break-all;">${logbookUrl}</a>
          </p>
        </td></tr>

        <!-- Tips -->
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:2px;">
            Quick Reminder
          </p>
          <ul style="margin:0;padding-left:16px;">
            <li style="font-size:12px;color:#64748b;line-height:1.8;">Log your Mon–Fri activities with as much detail as possible</li>
            <li style="font-size:12px;color:#64748b;line-height:1.8;">Add a weekly reflection before submitting</li>
            <li style="font-size:12px;color:#64748b;line-height:1.8;">Your supervisor will review it within a few days</li>
          </ul>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
            This is an automated reminder from IAMS. If you've already submitted your
            logbook, please disregard this message.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      const resendRes = await fetch("https://api.resend.com/emails", {
        method:  "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          from:    FROM_ADDRESS,
          to:      [studentEmail],
          subject: `⏰ Week ${weekNumber} logbook reminder — IAMS`,
          html,
        }),
      });

      if (!resendRes.ok) {
        const err = await resendRes.json();
        results.errors.push(`Email failed for ${studentEmail}: ${err.message ?? JSON.stringify(err)}`);
        continue;
      }

      results.reminded++;
      console.log(`Reminder sent → ${studentEmail} (Week ${weekNumber}, placement ${placement.id})`);

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.errors.push(`Placement ${placement.id}: ${msg}`);
    }
  }

  console.log("Reminder run complete:", results);

  return new Response(
    JSON.stringify({ success: true, ...results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
  );
});