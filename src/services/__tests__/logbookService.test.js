/**
 * Unit Tests — logbookService (Release 2)
 * US-04: Digital Logbook — submitWeek guard
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── vi.hoisted ensures these are defined BEFORE vi.mock hoists the factory ───
const { mockFrom, mockUpdate, mockNeq, mockEq } = vi.hoisted(() => {
  const mockUpdate = vi.fn().mockResolvedValue({ error: null });
  const mockNeq    = vi.fn().mockReturnValue(Promise.resolve({ error: null }));
  const mockEq     = vi.fn().mockReturnValue({ neq: mockNeq });

  const updateChain = { eq: mockEq };
  const mockFrom = vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue(updateChain) });

  return { mockFrom, mockUpdate, mockNeq, mockEq };
});

vi.mock("../../lib/supabaseClient", () => ({
  supabase: { from: mockFrom },
}));

import { logbookService } from "../logbookService";

describe("logbookService.submitWeek", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });
  });

  it("calls supabase on logbook_weeks table", async () => {
    await logbookService.submitWeek("week-001");
    expect(mockFrom).toHaveBeenCalledWith("logbook_weeks");
  });

  it("sets status to submitted with a submitted_at timestamp", async () => {
    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        neq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    mockFrom.mockReturnValue({ update: updateSpy });

    await logbookService.submitWeek("week-001");

    const arg = updateSpy.mock.calls[0][0];
    expect(arg.status).toBe("submitted");
    expect(arg.submitted_at).toBeTruthy();
  });

  it("applies .neq('status', 'approved') — approved weeks are blocked", async () => {
    const neqSpy = vi.fn().mockResolvedValue({ error: null });
    const eqSpy  = vi.fn().mockReturnValue({ neq: neqSpy });
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: eqSpy }),
    });

    await logbookService.submitWeek("week-approved");
    expect(neqSpy).toHaveBeenCalledWith("status", "approved");
  });

  it("resolves true for a draft week — draft can be submitted", async () => {
    await expect(logbookService.submitWeek("week-draft")).resolves.toBe(true);
  });

  it("resolves true for action_needed week — resubmission is allowed", async () => {
    await expect(logbookService.submitWeek("week-flagged")).resolves.toBe(true);
  });

  it("throws when Supabase returns an error", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ error: { message: "DB write failed" } }),
        }),
      }),
    });

    await expect(logbookService.submitWeek("bad-week")).rejects.toThrow("DB write failed");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("logbookService.updateDailyLog — selective field updates", () => {

  const makeUpdateChain = (updateSpy) => ({
    update: updateSpy ?? vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  });

  it("sends only template_type + updated_at when other fields are undefined", async () => {
    let capturedPayload;
    const updateSpy = vi.fn((payload) => {
      capturedPayload = payload;
      return { eq: vi.fn().mockResolvedValue({ error: null }) };
    });
    mockFrom.mockReturnValue(makeUpdateChain(updateSpy));

    await logbookService.updateDailyLog("log-001", { template_type: "technical" });

    expect(capturedPayload).toHaveProperty("template_type", "technical");
    expect(capturedPayload).toHaveProperty("updated_at");
    expect(capturedPayload).not.toHaveProperty("activity_details");
    expect(capturedPayload).not.toHaveProperty("tasks_completed");
    expect(capturedPayload).not.toHaveProperty("hours_worked");
  });

  it("includes all defined fields when a full update is sent", async () => {
    let capturedPayload;
    const updateSpy = vi.fn((payload) => {
      capturedPayload = payload;
      return { eq: vi.fn().mockResolvedValue({ error: null }) };
    });
    mockFrom.mockReturnValue(makeUpdateChain(updateSpy));

    await logbookService.updateDailyLog("log-002", {
      activity_details:  "helped with sprint",
      tasks_completed:   "fixed bug #42",
      learning_outcomes: "learned CI/CD",
      challenges:        "merge conflicts",
      hours_worked:      7.5,
      template_type:     "technical",
    });

    expect(capturedPayload).toMatchObject({
      activity_details:  "helped with sprint",
      tasks_completed:   "fixed bug #42",
      learning_outcomes: "learned CI/CD",
      challenges:        "merge conflicts",
      hours_worked:      7.5,
      template_type:     "technical",
    });
  });

  it("omits undefined fields even when others are defined", async () => {
    let capturedPayload;
    const updateSpy = vi.fn((payload) => {
      capturedPayload = payload;
      return { eq: vi.fn().mockResolvedValue({ error: null }) };
    });
    mockFrom.mockReturnValue(makeUpdateChain(updateSpy));

    await logbookService.updateDailyLog("log-003", {
      hours_worked:  8,
      template_type: "soft_skills",
    });

    expect(capturedPayload).toHaveProperty("hours_worked", 8);
    expect(capturedPayload).toHaveProperty("template_type", "soft_skills");
    expect(capturedPayload).not.toHaveProperty("challenges");
    expect(capturedPayload).not.toHaveProperty("activity_details");
  });

  it("calls supabase.from('daily_logs')", async () => {
    mockFrom.mockReturnValue(makeUpdateChain());
    await logbookService.updateDailyLog("log-004", { template_type: "standard" });
    expect(mockFrom).toHaveBeenCalledWith("daily_logs");
  });

  it("throws when Supabase returns an error", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: "column missing" } }),
      }),
    });
    await expect(
      logbookService.updateDailyLog("bad-log", { activity_details: "..." })
    ).rejects.toThrow("column missing");
  });
});