/**
 * Unit Tests — coordinatorService Release 2 additions
 * rejectStudent, reinstateStudent, rejected status passthrough
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── vi.hoisted prevents ReferenceError when factory is hoisted ───────────────
const { mockInvoke, mockFrom } = vi.hoisted(() => {
  const mockInvoke = vi.fn().mockResolvedValue({ error: null });

  // Build a reusable chainable mock
  const makeSingle = (status) => ({
    data: { id: "s1", status },
    error: null,
  });

  const makeChain = (status = "rejected") => {
    const chain = {};
    chain.update      = vi.fn().mockReturnValue(chain);
    chain.select      = vi.fn().mockReturnValue(chain);
    chain.eq          = vi.fn().mockReturnValue(chain);
    chain.single      = vi.fn().mockResolvedValue(makeSingle(status));
    chain.maybeSingle = vi.fn().mockResolvedValue(makeSingle(status));
    chain.delete      = vi.fn().mockReturnValue(chain);
    return chain;
  };

  const mockFrom = vi.fn(() => makeChain());

  return { mockInvoke, mockFrom, makeChain };
});

vi.mock("../../lib/supabaseClient", () => ({
  supabase: {
    from:      mockFrom,
    functions: { invoke: mockInvoke },
  },
}));

import { coordinatorService } from "../coordinatorService";

// ── Helper: reset mockFrom to return a chain with a given status ─────────────
const resetChain = (status) => {
  const chain = {};
  chain.update      = vi.fn().mockReturnValue(chain);
  chain.select      = vi.fn().mockReturnValue(chain);
  chain.eq          = vi.fn().mockReturnValue(chain);
  chain.single      = vi.fn().mockResolvedValue({ data: { id: "s1", status }, error: null });
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: { id: "s1", status }, error: null });
  chain.delete      = vi.fn().mockReturnValue(chain);
  mockFrom.mockReturnValue(chain);
};

const resetError = () => {
  const chain = {};
  chain.update      = vi.fn().mockReturnValue(chain);
  chain.select      = vi.fn().mockReturnValue(chain);
  chain.eq          = vi.fn().mockReturnValue(chain);
  chain.single      = vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } });
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } });
  mockFrom.mockReturnValue(chain);
};

// ─────────────────────────────────────────────────────────────────────────────

describe("coordinatorService.rejectStudent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue({ error: null });
    resetChain("rejected");
  });

  it("queries student_profiles table", async () => {
    await coordinatorService.rejectStudent("student-001", "Karabo Ayal");
    expect(mockFrom).toHaveBeenCalledWith("student_profiles");
  });

  it("returns data with status rejected", async () => {
    const result = await coordinatorService.rejectStudent("student-001", "Karabo Ayal");
    expect(result.status).toBe("rejected");
  });

  it("invokes send-student-status-notification edge function", async () => {
    await coordinatorService.rejectStudent("student-001", "Karabo Ayal");
    // non-fatal fire-and-forget — wait a tick
    await new Promise(r => setTimeout(r, 10));
    expect(mockInvoke).toHaveBeenCalledWith(
      "send-student-status-notification",
      expect.objectContaining({
        body: expect.objectContaining({ status: "rejected" }),
      })
    );
  });

  it("throws when DB returns an error", async () => {
    resetError();
    await expect(
      coordinatorService.rejectStudent("bad-id", "Ghost Student")
    ).rejects.toThrow();
  });
});

describe("coordinatorService.reinstateStudent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain("pending");
  });

  it("returns data with status pending", async () => {
    const result = await coordinatorService.reinstateStudent("student-001");
    expect(result.status).toBe("pending");
  });

  it("throws when DB returns an error", async () => {
    resetError();
    await expect(
      coordinatorService.reinstateStudent("bad-id")
    ).rejects.toThrow();
  });
});

describe("coordinatorService.updateStudentStatus — rejected passthrough", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain("rejected");
  });

  it("accepts 'rejected' as a valid status without throwing", async () => {
    await expect(
      coordinatorService.updateStudentStatus("student-001", "rejected")
    ).resolves.toBeDefined();
  });

  it("sanitizes 'REJECTED' to lowercase before DB write", async () => {
    const result = await coordinatorService.updateStudentStatus("student-001", "REJECTED");
    expect(result.status).toBe("rejected");
  });
});