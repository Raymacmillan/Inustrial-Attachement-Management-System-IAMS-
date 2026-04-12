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

    const allMatches: any[] = [];
    const unplaceableStudents: any[] = [];

    students?.forEach(student => {
      const prefs = student.student_preferences;

      // ── Student has no preferences — cannot score against any vacancy ──
      if (!prefs) {
        const baseMissing = [];
        if (!student.cv_url) baseMissing.push('CV');
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

      // Score this student against every vacancy
      vacancies?.forEach(vacancy => {
        const org = vacancy.organization_profiles;

        // ── Document check against THIS org's specific requirements ──
        const missingDocs = [];
        if (org?.requires_cv && !student.cv_url) missingDocs.push('CV');
        if (org?.requires_transcript && !student.transcript_url) missingDocs.push('Transcript');
        const docWarning = missingDocs.length > 0
          ? `Missing: ${missingDocs.join(' & ')} (required by ${org?.org_name})`
          : null;
        const hasAllDocs = missingDocs.length === 0;

        // ── Skills score (50 points max) ──
        const matchedSkills = (prefs.technical_skills || []).filter((skill: string) =>
          (vacancy.required_skills || [])
            .map((s: string) => s.toLowerCase())
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
        const studentGpa = parseFloat(student.gpa) || 0;
        if (studentGpa >= (vacancy.min_gpa_required || 0)) {
          breakdown.gpa = Math.round((studentGpa / 5.0) * 30);
          score += breakdown.gpa;
        }

        // ── Location score (20 points max) ──
        const locationMatch = (prefs.preferred_locations || []).some((loc: string) =>
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
          doc_warning:        docWarning,
          has_all_docs:       hasAllDocs,
          is_unplaceable:     false,
          unplaceable_reason: null,
          available_slots:    vacancy.available_slots,
        });
      });
    });

    // ── SLOT-AWARE DEDUPLICATION ──────────────────────────────────────────────
    // Rule 1: Each student appears only once (best scoring vacancy wins).
    // Rule 2: Each vacancy is suggested to at most available_slots students.
    //         Students beyond the cap are redirected to their next-best vacancy.
    //
    // Algorithm:
    //   Pass 1 — iterate matches in score order. Assign student to vacancy only
    //            if (a) student not yet assigned AND (b) vacancy has remaining
    //            capacity. Skip otherwise.
    //   Pass 2 — students not placed in pass 1 get their next-best vacancy that
    //            still has capacity. If truly no capacity anywhere, mark
    //            unplaceable.

    // Sort all matches by score descending so highest scores win first
    allMatches.sort((a, b) => b.total_score - a.total_score);

    const assignedStudents = new Set<string>();
    const vacancySlotUsed: Record<string, number> = {};
    const finalMatches: any[] = [];

    // Pass 1 — assign students to their best vacancy within slot limits
    for (const match of allMatches) {
      if (assignedStudents.has(match.student_id)) continue;

      const used = vacancySlotUsed[match.vacancy_id] || 0;
      if (used < match.available_slots) {
        finalMatches.push(match);
        assignedStudents.add(match.student_id);
        vacancySlotUsed[match.vacancy_id] = used + 1;
      }
    }

    // Pass 2 — students not yet placed, find next-best vacancy with capacity
    const byStudent: Record<string, any[]> = {};
    for (const match of allMatches) {
      if (assignedStudents.has(match.student_id)) continue;
      if (!byStudent[match.student_id]) byStudent[match.student_id] = [];
      byStudent[match.student_id].push(match);
    }

    for (const [studentId, matches] of Object.entries(byStudent)) {
      if (assignedStudents.has(studentId)) continue;
      let placed = false;

      for (const match of matches) {
        const used = vacancySlotUsed[match.vacancy_id] || 0;
        if (used < match.available_slots) {
          finalMatches.push(match);
          assignedStudents.add(studentId);
          vacancySlotUsed[match.vacancy_id] = used + 1;
          placed = true;
          break;
        }
      }

      // No vacancy has capacity for this student
      if (!placed && matches.length > 0) {
        finalMatches.push({
          ...matches[0],
          is_unplaceable:     true,
          unplaceable_reason: 'All matching vacancies are at full capacity. More slots needed.',
          vacancy_id:         null,
        });
        assignedStudents.add(studentId);
      }
    }

    // Sort final results: placeable by score desc, then unplaceable
    const placeable   = finalMatches.filter(m => !m.is_unplaceable)
                                    .sort((a, b) => b.total_score - a.total_score);
    const unplaceable = finalMatches.filter(m => m.is_unplaceable);
    const matchResults = [...placeable, ...unplaceableStudents, ...unplaceable];

    return new Response(JSON.stringify(matchResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})