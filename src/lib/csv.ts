import { firstIssue, applicationSchema, type ApplicationInput } from "./validation";
import { isStage, STAGE_META, type Application } from "./types";

export const CSV_HEADERS = [
  "company",
  "role",
  "location",
  "url",
  "salary",
  "stage",
  "source",
  "appliedAt",
  "notes",
] as const;

export interface ParsedCsv {
  rows: { input: ApplicationInput; notes: string[] }[];
  errors: string[];
}

const MAX_ROWS = 500;

export function applicationsToCsv(apps: Application[]): string {
  const lines = [CSV_HEADERS.join(",")];
  const sorted = [...apps].sort((a, b) => a.company.localeCompare(b.company) || a.role.localeCompare(b.role));
  for (const app of sorted) {
    const notes = app.notes.map((note) => note.body).join(" | ");
    lines.push(
      [
        app.company,
        app.role,
        app.location,
        app.url,
        app.salary,
        app.stage,
        app.source,
        app.appliedAt,
        notes,
      ]
        .map(escapeCell)
        .join(","),
    );
  }
  return `\uFEFF${lines.join("\n")}\n`;
}

/** Prefix spreadsheet formulas so Excel does not execute exported cells. */
export function escapeCell(value: string): string {
  const neutralized = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  if (neutralized !== value || /[",\n\r]/.test(neutralized)) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

export function parseCsv(text: string): ParsedCsv {
  const source = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!source) return { rows: [], errors: ["The CSV file is empty."] };

  const records = parseRecords(source);
  if (records.length === 0) return { rows: [], errors: ["The CSV file is empty."] };

  const header = records[0].map((cell) => cell.trim().toLowerCase());
  const index = new Map(header.map((name, i) => [name, i]));
  const missing = ["company", "role", "stage"].filter((name) => !index.has(name));
  if (missing.length > 0) {
    return { rows: [], errors: [`Missing column: ${missing.join(", ")}.`] };
  }

  const data = records.slice(1).filter((row) => row.some((cell) => cell.trim() !== ""));
  if (data.length > MAX_ROWS) {
    return { rows: [], errors: [`Import is limited to ${MAX_ROWS} rows.`] };
  }

  const rows: ParsedCsv["rows"] = [];
  const errors: string[] = [];

  data.forEach((record, offset) => {
    const line = offset + 2;
    const cell = (name: string) => {
      const at = index.get(name);
      return at === undefined ? "" : (record[at] ?? "").trim();
    };
    const stageRaw = cell("stage").toUpperCase().replace(/\s+/g, "_");
    const stage = isStage(stageRaw)
      ? stageRaw
      : matchStageLabel(cell("stage"));
    const parsed = applicationSchema.safeParse({
      company: cell("company"),
      role: cell("role"),
      location: cell("location"),
      url: cell("url"),
      salary: cell("salary"),
      stage: stage ?? cell("stage"),
      source: cell("source"),
      appliedAt: cell("appliedat"),
    });
    if (!parsed.success) {
      errors.push(`Row ${line}: ${firstIssue(parsed.error)}`);
      return;
    }
    const notes = cell("notes")
      .split(/\s+\|\s+/)
      .map((note) => note.trim())
      .filter(Boolean);
    rows.push({ input: parsed.data, notes });
  });

  if (rows.length === 0 && errors.length === 0) {
    errors.push("No application rows found.");
  }
  return { rows, errors };
}

function matchStageLabel(value: string): string | undefined {
  const needle = value.trim().toLowerCase();
  return Object.entries(STAGE_META).find(([, meta]) => meta.label.toLowerCase() === needle)?.[0];
}

function parseRecords(text: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (char === "\n") {
      row.push(cell);
      records.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    records.push(row);
  }
  return records;
}
