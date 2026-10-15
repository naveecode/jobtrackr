import { describe, expect, it } from "vitest";
import { applicationSchema, noteSchema, reminderSchema } from "./validation";

const valid = {
  company: "Initech",
  role: "Product Engineer",
  location: "Austin",
  url: "https://initech.example/jobs",
  salary: "$160k",
  stage: "APPLIED",
  source: "Referral",
  appliedAt: "2026-04-02",
};

describe("applicationSchema", () => {
  it("accepts a complete application", () => {
    const parsed = applicationSchema.parse(valid);
    expect(parsed.company).toBe("Initech");
    expect(parsed.stage).toBe("APPLIED");
  });

  it("trims required fields and allows blanks for optional ones", () => {
    const parsed = applicationSchema.parse({
      company: "  Hooli  ",
      role: "  Web Engineer ",
      stage: "SAVED",
    });
    expect(parsed.company).toBe("Hooli");
    expect(parsed.role).toBe("Web Engineer");
    expect(parsed.url).toBe("");
    expect(parsed.appliedAt).toBe("");
    expect(parsed.location).toBe("");
  });

  it("rejects a missing company or role", () => {
    expect(applicationSchema.safeParse({ ...valid, company: "  " }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...valid, role: "" }).success).toBe(false);
  });

  it("rejects an unknown stage", () => {
    const result = applicationSchema.safeParse({ ...valid, stage: "GHOSTED" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toMatch(/stage/i);
  });

  it("rejects a malformed url and a javascript url", () => {
    expect(applicationSchema.safeParse({ ...valid, url: "not a url" }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...valid, url: "javascript:alert(1)" }).success).toBe(false);
  });

  it("accepts an empty url", () => {
    expect(applicationSchema.safeParse({ ...valid, url: "" }).success).toBe(true);
  });

  it("rejects impossible calendar dates", () => {
    expect(applicationSchema.safeParse({ ...valid, appliedAt: "2026-02-31" }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...valid, appliedAt: "04/02/2026" }).success).toBe(false);
  });

  it("rejects an oversized salary", () => {
    expect(applicationSchema.safeParse({ ...valid, salary: "x".repeat(81) }).success).toBe(false);
  });
});

describe("noteSchema", () => {
  it("requires a body and trims it", () => {
    expect(noteSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(noteSchema.parse({ body: "  Called the recruiter  " }).body).toBe("Called the recruiter");
  });
});

describe("reminderSchema", () => {
  it("requires a title and a parseable due date", () => {
    expect(reminderSchema.safeParse({ title: "", dueAt: "2026-05-01T15:00" }).success).toBe(false);
    expect(reminderSchema.safeParse({ title: "Follow up", dueAt: "tomorrow" }).success).toBe(false);
    expect(reminderSchema.safeParse({ title: "Follow up", dueAt: "2026-05-01T15:00" }).success).toBe(true);
  });
});
