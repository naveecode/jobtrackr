import { describe, expect, it } from "vitest";
import { applicationsToCsv, escapeCell, parseCsv } from "./csv";
import { seedApplications } from "./seed";
import type { Application } from "./types";

function app(overrides: Partial<Application> = {}): Application {
  return {
    id: "a1",
    company: "Initech",
    role: "Product Engineer",
    location: "Austin, TX",
    url: "https://initech.example/jobs",
    salary: "$160k",
    stage: "SAVED",
    source: "Referral",
    appliedAt: "",
    position: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    notes: [],
    reminders: [],
    ...overrides,
  };
}

describe("csv", () => {
  it("round-trips applications, including commas and notes", () => {
    const csv = applicationsToCsv([
      app({
        notes: [
          { id: "n1", applicationId: "a1", body: "Met at a meetup", createdAt: "2026-01-01T00:00:00.000Z" },
          { id: "n2", applicationId: "a1", body: "Asked about comp", createdAt: "2026-01-02T00:00:00.000Z" },
        ],
      }),
    ]);
    const parsed = parseCsv(csv);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].input.company).toBe("Initech");
    expect(parsed.rows[0].input.location).toBe("Austin, TX");
    expect(parsed.rows[0].input.stage).toBe("SAVED");
    expect(parsed.rows[0].notes).toEqual(["Met at a meetup", "Asked about comp"]);
  });

  it("keeps valid rows when one row has a bad stage", () => {
    const csv = [
      "company,role,stage",
      "Hooli,Web Engineer,SAVED",
      "Pied Piper,Backend Engineer,GHOSTED",
    ].join("\n");
    const parsed = parseCsv(csv);
    expect(parsed.rows.map((row) => row.input.company)).toEqual(["Hooli"]);
    expect(parsed.errors[0]).toMatch(/Row 3/);
  });

  it("accepts stage labels and a leading BOM", () => {
    const parsed = parseCsv("\uFEFFcompany,role,stage\nHooli,Web Engineer,Interview\n");
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0].input.stage).toBe("INTERVIEW");
  });

  it("reports a missing required column", () => {
    expect(parseCsv("company,location\nHooli,Austin\n").errors[0]).toMatch(/Missing column/);
  });

  it("neutralizes spreadsheet formulas", () => {
    expect(escapeCell('=HYPERLINK("http://evil")')).toBe(`"'=HYPERLINK(""http://evil"")"`);
    const csv = applicationsToCsv([app({ company: "=CMD()" })]);
    expect(csv).toContain(`"'=CMD()"`);
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it("exports the seeded board", () => {
    const parsed = parseCsv(applicationsToCsv(seedApplications()));
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(12);
    expect(parsed.rows.some((row) => row.input.company === "Vercel" && row.input.stage === "OFFER")).toBe(true);
  });
});
