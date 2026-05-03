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