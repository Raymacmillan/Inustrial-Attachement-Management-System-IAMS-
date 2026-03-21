import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: students } = await supabase
      .from('student_profiles')
      .select('*, student_preferences(*)')
      .eq('status', 'pending');

    const { data: vacancies } = await supabase
      .from('organization_vacancies')
      .select('*, organization_profiles(org_name, location)')
      .gt('available_slots', 0)
      .eq('is_active', true);

    const matchResults = [];

    students?.forEach(student => {
      const prefs = student.student_preferences;
      if (!prefs) return; 

      vacancies?.forEach(vacancy => {
        let score = 0;

        const matchedSkills = (prefs.technical_skills || []).filter(skill => 
          vacancy.required_skills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
        );
        if (vacancy.required_skills.length > 0) {
          score += (matchedSkills.length / vacancy.required_skills.length) * 50;
        }

        if (student.gpa >= (vacancy.min_gpa_required || 0)) {
          score += ((student.gpa || 0) / 5.0) * 30; 
        }

        const locationMatch = (prefs.preferred_locations || []).some(loc => 
          loc.toLowerCase() === vacancy.organization_profiles?.location?.toLowerCase()
        );
        if (locationMatch) score += 20;

        matchResults.push({
          student_id: student.id,
          student_name: student.full_name,
          vacancy_id: vacancy.id,
          org_id: vacancy.org_id,
          org_name: vacancy.organization_profiles.org_name,
          role: vacancy.role_title,
          total_score: Math.round(score),
        });
      });
    });

    matchResults.sort((a, b) => b.total_score - a.total_score);

    return new Response(JSON.stringify(matchResults), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500 
    });
  }
})