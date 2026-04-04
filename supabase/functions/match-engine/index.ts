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

    // Fetch all pending students with their preferences and document URLs
    const { data: students } = await supabase
      .from('student_profiles')
      .select('*, student_preferences(*)')
      .eq('status', 'pending');

    // Fetch active vacancies with org details including document requirements
    const { data: vacancies } = await supabase
      .from('organization_vacancies')
      .select('*, organization_profiles(org_name, location, requires_cv, requires_transcript)')
      .gt('available_slots', 0)
      .eq('is_active', true);

    // allMatches holds every student × vacancy combination scored
    const allMatches = [];
    // unplaceableStudents holds students with no preferences set
    const unplaceableStudents = [];

    students?.forEach(student => {
      const prefs = student.student_preferences;

      // ── Student has no preferences — cannot score against any vacancy ──
      if (!prefs) {
        const baseMissing = [];
        if (!student.cv_url)         baseMissing.push('CV');
        if (!student.transcript_url) baseMissing.push('Transcript');

        unplaceableStudents.push({
          student_id:         student.id,
          student_name:       student.full_name,
          vacancy_id:         null,
          org_id:             null,
          org_name:           null,
          role:               null,
          total_score:        0,
          score_breakdown:    { skills: 0, gpa: 0, location: 0 },
          doc_warning:        baseMissing.length > 0 ? `Missing: ${baseMissing.join(' & ')}` : null,
          has_all_docs:       baseMissing.length === 0,
          is_unplaceable:     true,
          unplaceable_reason: 'No career preferences set. Student must complete their preferences profile.',
        });
        return;
      }

      // Score this student against every active vacancy
      vacancies?.forEach(vacancy => {
        const org = vacancy.organization_profiles;

        // ── Document check against THIS org's specific requirements ──
        // Only flag documents the organization actually requires.
        // A missing CV is not a problem if the org does not require one.
        const missingDocs = [];
        if (org?.requires_cv         && !student.cv_url)         missingDocs.push('CV');
        if (org?.requires_transcript && !student.transcript_url) missingDocs.push('Transcript');

        const docWarning = missingDocs.length > 0
          ? `Missing: ${missingDocs.join(' & ')} (required by ${org?.org_name})`
          : null;
        const hasAllDocs = missingDocs.length === 0;

        // ── Skills score (50 points max) ──
        const matchedSkills = (prefs.technical_skills || []).filter(skill =>
          (vacancy.required_skills || [])
            .map((s) => s.toLowerCase())
            .includes(skill.toLowerCase())
        );
        let score = 0;
        const breakdown = { skills: 0, gpa: 0, location: 0 };

        if (vacancy.required_skills?.length > 0) {
          breakdown.skills = Math.round(
            (matchedSkills.length / vacancy.required_skills.length) * 50
          );
          score += breakdown.skills;
        }

        // ── GPA score (30 points max) ──
        // Uses 0 if GPA is null so students still appear but rank lower
        const studentGpa = parseFloat(student.gpa) || 0;
        if (studentGpa >= (vacancy.min_gpa_required || 0)) {
          breakdown.gpa = Math.round((studentGpa / 5.0) * 30);
          score += breakdown.gpa;
        }

        // ── Location score (20 points max) ──
        const locationMatch = (prefs.preferred_locations || []).some(loc =>
          loc.toLowerCase() === org?.location?.toLowerCase()
        );
        if (locationMatch) {
          breakdown.location = 20;
          score += 20;
        }

        allMatches.push({
          student_id:         student.id,
          student_name:       student.full_name,
          vacancy_id:         vacancy.id,
          org_id:             vacancy.org_id,
          org_name:           org?.org_name,
          role:               vacancy.role_title,
          total_score:        Math.round(score),
          score_breakdown:    breakdown,
          matched_skills:     matchedSkills,
          doc_warning:        docWarning,   // null if org's requirements are satisfied
          has_all_docs:       hasAllDocs,
          is_unplaceable:     false,
          unplaceable_reason: null,
        });
      });
    });

    // ── DEDUPLICATION: one result per student — keep highest score ──
    // A student appears once in the UI regardless of how many vacancies
    // an org has posted. We keep the best-matching vacancy for them.
    const bestMatchPerStudent = Object.values(
      allMatches.reduce((acc, match) => {
        const existing = acc[match.student_id];
        if (!existing || match.total_score > existing.total_score) {
          acc[match.student_id] = match;
        }
        return acc;
      }, {} as Record<string, typeof allMatches[0]>)
    );

    // Sort placeable matches by score descending, then append unplaceable at bottom
    bestMatchPerStudent.sort((a, b) => b.total_score - a.total_score);
    const matchResults = [...bestMatchPerStudent, ...unplaceableStudents];

    return new Response(JSON.stringify(matchResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})