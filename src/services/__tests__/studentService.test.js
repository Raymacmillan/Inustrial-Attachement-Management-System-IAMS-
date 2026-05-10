/**
 * Unit tests — studentService.getStudentAssessments
 *
 * Verifies the function returns the correct shape, handles empty results,
 * swallows PGRST116 (no rows) on supervisor_reports, and re-throws real errors.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mutable result holders — read at call time, not at mock-factory time ──────
let mockVisitResult  = { data: [],   error: null };
let mockReportResult = { data: null, error: null };

vi.mock("../../lib/supabaseClient", () => {
  // Returns a chain where the terminating method resolves to the mutable holder
  const visitChain = () => {
    const chain = {
      select:      () => chain,
      eq:          () => chain,
      order:       () => Promise.resolve(mockVisitResult),
    };
    return chain;
  };

  const reportChain = () => {
    const chain = {
      select:      () => chain,
      eq:          () => chain,
      maybeSingle: () => Promise.resolve(mockReportResult),
    };
    return chain;
  };

  return {
    supabase: {
      from: vi.fn((table) => {
        if (table === "visit_assessments") return visitChain();
        if (table === "supervisor_reports") return reportChain();
        return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) };
      }),
    },
  };
});

import { getStudentAssessments } from "../studentService";

describe("getStudentAssessments", () => {
  beforeEach(() => {
    mockVisitResult  = { data: [],   error: null };
    mockReportResult = { data: null, error: null };
  });

  it("returns empty arrays and null report when no records exist", async () => {
    const result = await getStudentAssessments("placement-abc");
    expect(result.visitAssessments).toEqual([]);
    expect(result.supervisorReport).toBeNull();
  });

  it("returns visit assessments from visit_assessments table", async () => {
    mockVisitResult = {
      data: [
        { id: "va-1", visit_number: 1, status: "submitted", overall_score: 8 },
        { id: "va-2", visit_number: 2, status: "pending",   overall_score: null },
      ],
      error: null,
    };
    const result = await getStudentAssessments("placement-abc");
    expect(result.visitAssessments).toHaveLength(2);
    expect(result.visitAssessments[0].visit_number).toBe(1);
    expect(result.visitAssessments[1].visit_number).toBe(2);
  });

  it("returns the supervisor report when one exists", async () => {
    mockReportResult = {
      data: { id: "sr-1", placement_id: "placement-abc", status: "submitted", overall_performance: 9 },
      error: null,
    };
    const result = await getStudentAssessments("placement-abc");
    expect(result.supervisorReport).not.toBeNull();
    expect(result.supervisorReport.overall_performance).toBe(9);
  });

  it("does not throw when supervisor_reports returns PGRST116 (no rows)", async () => {
    mockReportResult = { data: null, error: { code: "PGRST116", message: "no rows" } };
    await expect(getStudentAssessments("placement-abc")).resolves.toBeDefined();
  });

  it("throws when visit_assessments query returns a real error", async () => {
    mockVisitResult = { data: null, error: { code: "42501", message: "permission denied" } };
    await expect(getStudentAssessments("placement-abc")).rejects.toMatchObject({
      message: "permission denied",
    });
  });

  it("throws when supervisor_reports returns a non-PGRST116 error", async () => {
    mockReportResult = { data: null, error: { code: "500", message: "server error" } };
    await expect(getStudentAssessments("placement-abc")).rejects.toMatchObject({
      message: "server error",
    });
  });
});
