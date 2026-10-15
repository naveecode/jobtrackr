import { describe, expect, it } from "vitest";
import { applyMove, appsInStage } from "./kanban";
import type { Application, Stage } from "./types";

function card(id: string, stage: Stage, position: number, appliedAt = ""): Application {
  return {
    id,
    company: id,
    role: "Engineer",
    location: "",
    url: "",
    salary: "",
    stage,
    source: "",
    appliedAt,
    position,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    notes: [],
    reminders: [],
  };
}

function order(apps: Application[] | null, stage: Stage) {
  return apps
    ?.filter((app) => app.stage === stage)
    .sort((a, b) => a.position - b.position)
    .map((app) => app.id);
}

describe("applyMove", () => {
  const apps = [card("a", "SAVED", 0), card("b", "APPLIED", 0), card("c", "APPLIED", 1), card("d", "INTERVIEW", 0)];

  it("reorders within a column using arrayMove indexes", () => {
    const next = applyMove(apps, "c", "b", "2026-10-15");
    expect(order(next, "APPLIED")).toEqual(["c", "b"]);
    expect(order(next, "SAVED")).toEqual(["a"]);
  });

  it("inserts before the card it is dropped on in another column", () => {
    const next = applyMove(apps, "a", "c", "2026-10-15");
    expect(order(next, "SAVED")).toEqual([]);
    expect(order(next, "APPLIED")).toEqual(["b", "a", "c"]);
    expect(next?.find((app) => app.id === "a")?.appliedAt).toBe("2026-10-15");
  });

  it("appends when dropped on a column", () => {
    const next = applyMove(apps, "a", "INTERVIEW", "2026-10-15");
    expect(order(next, "INTERVIEW")).toEqual(["d", "a"]);
  });

  it("does not overwrite an existing applied date", () => {
    const dated = [card("a", "APPLIED", 0, "2026-01-02"), card("b", "INTERVIEW", 0, "2026-02-02")];
    const next = applyMove(dated, "a", "b", "2026-10-15");
    expect(next?.find((app) => app.id === "a")?.appliedAt).toBe("2026-01-02");
  });

  it("returns null for a no-op or an unknown card", () => {
    expect(applyMove(apps, "b", "b", "2026-10-15")).toBeNull();
    expect(applyMove(apps, "missing", "APPLIED", "2026-10-15")).toBeNull();
    expect(applyMove(apps, "a", "missing", "2026-10-15")).toBeNull();
  });
});

describe("appsInStage", () => {
  it("filters by company, role, or location and keeps position order", () => {
    const apps = [
      card("b", "SAVED", 1),
      card("a", "SAVED", 0),
      { ...card("c", "SAVED", 2), company: "Figma", role: "Design Systems", location: "San Francisco" },
    ];
    expect(appsInStage(apps, "SAVED").map((app) => app.id)).toEqual(["a", "b", "c"]);
    expect(appsInStage(apps, "SAVED", "design").map((app) => app.id)).toEqual(["c"]);
    expect(appsInStage(apps, "APPLIED", "figma")).toEqual([]);
  });
});
