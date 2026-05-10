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
      Deno.env.get("SUPABASE_URL")             ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, invitationId, fullName, jobTitle } = await req.json();
    if (!userId || !invitationId) throw new Error("userId and invitationId are required.");

    // 1. Fetch invitation
    const { data: inv, error: invError } = await supabase
      .from("supervisor_invitations")
      .select("id, email, supervisor_type, org_supervisor_id, uni_supervisor_id, status")
      .eq("id", invitationId)
      .single();

    if (invError || !inv) throw new Error("Invitation not found.");
    if (inv.status === "accepted") throw new Error("This invitation has already been used.");

    // Auto-confirm user email so they can sign in immediately
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );

    if (confirmError) throw new Error(`Failed to auto-confirm user: ${confirmError.message}`);

    // 2. Check the user doesn't already have a conflicting role
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingRole && existingRole.role !== inv.supervisor_type) {
      throw new Error(
        `This email is already registered as a ${existingRole.role}. ` +
        `Please use a different email address to register as a ${inv.supervisor_type.replace(/_/g, " ")}.`
      );
    }

    // 3. Insert user_roles (service role bypasses RLS)
    if (!existingRole) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: inv.supervisor_type }]);

      if (roleError && roleError.code !== "23505") throw roleError;
    }

    // 4. Link user_id to roster row
    if (inv.supervisor_type === "industrial_supervisor" && inv.org_supervisor_id) {
      const { error: linkError } = await supabase
        .from("organization_supervisors")
        .update({ user_id: userId, full_name: fullName, role_title: jobTitle })
        .eq("id", inv.org_supervisor_id);

      if (linkError) throw linkError;
    }

    if (inv.supervisor_type === "university_supervisor" && inv.uni_supervisor_id) {
      const { error: linkError } = await supabase
        .from("university_supervisors")
        .update({ user_id: userId })
        .eq("id", inv.uni_supervisor_id);

      if (linkError) throw linkError;
    }

    // 5. Mark invitation accepted
    await supabase
      .from("supervisor_invitations")
      .update({ status: "accepted" })
      .eq("id", invitationId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
