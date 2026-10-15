import { describe, expect, it } from "vitest";
import { funnelBars, insight, isResponse, isSubmission, summarize } from "./funnel";
import { seedApplications } from "./seed";
import type { Stage } from "./types";

function app(stage: Stage, appliedAt = "") {
  return { stage, appliedAt };
}

describe("funnel maths", () => {
  it("treats every stage except Saved as a submission, and interview, offer, and rejected as responses", () => {
    expect(isSubmission("SAVED")).toBe(false);
    expect(isSubmission("APPLIED")).toBe(true);
    expect(isResponse("APPLIED")).toBe(false);
    expect(isResponse("INTERVIEW")).toBe(true);
    expect(isResponse("OFFER")).toBe(true);
    expect(isResponse("REJECTED")).toBe(true);
  });

  it("returns a null rate when nothing has been submitted", () => {
    const summary = summarize([app("SAVED"), app("SAVED")]);
    expect(summary.total).toBe(2);
    expect(summary.submissions).toBe(0);
    expect(summary.responses).toBe(0);
    expect(summary.rate).toBeNull();
    expect(summary.interviewRate).toBeNull();
    expect(summary.offerRate).toBeNull();
    expect(summary.byMonth).toEqual([]);
    expect(insight(summary)).toMatch(/Apply to a few roles/);
  });

  it("counts an empty pipeline as zeros", () => {
    const summary = summarize([]);
    expect(summary.total).toBe(0);
    expect(summary.counts).toEqual({ SAVED: 0, APPLIED: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0 });
    expect(funnelBars(summary).map((bar) => bar.count)).toEqual([0, 0, 0, 0, 0]);
  });

  it("computes response, interview, and offer rates from current stages", () => {
    const summary = summarize([
      app("SAVED"),
      app("APPLIED", "2026-01-04"),
      app("APPLIED", "2026-01-11"),
      app("INTERVIEW", "2026-02-02"),
      app("OFFER", "2026-02-20"),
      app("REJECTED", "2026-03-01"),
    ]);
    expect(summary.counts).toEqual({ SAVED: 1, APPLIED: 2, INTERVIEW: 1, OFFER: 1, REJECTED: 1 });
    expect(summary.submissions).toBe(5);
    expect(summary.responses).toBe(3);
    expect(summary.waiting).toBe(2);
    expect(summary.rate).toBeCloseTo(3 / 5);
    expect(summary.interviewRate).toBeCloseTo(2 / 5);
    expect(summary.offerRate).toBeCloseTo(1 / 5);
  });

  it("buckets submissions by applied month and skips rows without a date", () => {
    const summary = summarize([
      app("APPLIED", "2026-01-04"),
      app("REJECTED", "2026-01-20"),
      app("OFFER", "2026-03-02"),
      app("INTERVIEW"),
    ]);
    expect(summary.byMonth).toEqual([
      { month: "2026-01", label: "Jan 2026", submissions: 2, responses: 1, rate: 0.5 },
      { month: "2026-03", label: "Mar 2026", submissions: 1, responses: 1, rate: 1 },
    ]);
    expect(summary.submissions).toBe(4);
  });

  it("describes a strong response rate with the rounded percent", () => {
    const summary = summarize([app("OFFER", "2026-01-01"), app("REJECTED", "2026-01-02"), app("APPLIED", "2026-01-03")]);
    expect(insight(summary)).toContain("67%");
  });

  it("matches the seeded demo search", () => {
    const summary = summarize(seedApplications(new Date("2026-10-15T12:00:00Z")));
    expect(summary.total).toBe(12);
    expect(summary.counts).toEqual({ SAVED: 3, APPLIED: 3, INTERVIEW: 3, OFFER: 1, REJECTED: 2 });
    expect(summary.submissions).toBe(9);
    expect(summary.responses).toBe(6);
    expect(summary.rate).toBeCloseTo(6 / 9);
    expect(summary.byMonth.length).toBeGreaterThan(1);
  });
});
