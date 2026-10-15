import { monthKey, monthLabel } from "./format";
import { STAGES, STAGE_META, type Stage } from "./types";

export interface FunnelApp {
  stage: Stage;
  appliedAt?: string;
}

export interface MonthBucket {
  month: string;
  label: string;
  submissions: number;
  responses: number;
  rate: number | null;
}

export interface FunnelSummary {
  total: number;
  counts: Record<Stage, number>;
  submissions: number;
  responses: number;
  waiting: number;
  /** responses / submissions. Null when nothing has been submitted. */
  rate: number | null;
  /** (interview + offer) / submissions. Rejected applications are not assumed to have interviewed. */
  interviewRate: number | null;
  /** offer / submissions. */
  offerRate: number | null;
  byMonth: MonthBucket[];
}

const RESPONSE_STAGES = new Set<Stage>(["INTERVIEW", "OFFER", "REJECTED"]);

export function isSubmission(stage: Stage): boolean {
  return stage !== "SAVED";
}

export function isResponse(stage: Stage): boolean {
  return RESPONSE_STAGES.has(stage);
}

export function emptyCounts(): Record<Stage, number> {
  return { SAVED: 0, APPLIED: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0 };
}

function ratio(part: number, whole: number): number | null {
  if (whole === 0) return null;
  return part / whole;
}

export function summarize(apps: FunnelApp[]): FunnelSummary {
  const counts = emptyCounts();
  for (const app of apps) counts[app.stage] += 1;

  const submissions = apps.filter((app) => isSubmission(app.stage)).length;
  const responses = apps.filter((app) => isResponse(app.stage)).length;
  const waiting = counts.APPLIED;
  const interviews = counts.INTERVIEW + counts.OFFER;

  const months = new Map<string, { submissions: number; responses: number }>();
  for (const app of apps) {
    if (!isSubmission(app.stage) || !app.appliedAt) continue;
    const key = monthKey(app.appliedAt);
    const bucket = months.get(key) ?? { submissions: 0, responses: 0 };
    bucket.submissions += 1;
    if (isResponse(app.stage)) bucket.responses += 1;
    months.set(key, bucket);
  }

  const byMonth = [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, bucket]) => ({
      month,
      label: monthLabel(month),
      submissions: bucket.submissions,
      responses: bucket.responses,
      rate: ratio(bucket.responses, bucket.submissions),
    }));

  return {
    total: apps.length,
    counts,
    submissions,
    responses,
    waiting,
    rate: ratio(responses, submissions),
    interviewRate: ratio(interviews, submissions),
    offerRate: ratio(counts.OFFER, submissions),
    byMonth,
  };
}

export function funnelBars(summary: FunnelSummary): { stage: Stage; label: string; count: number; color: string }[] {
  return STAGES.map((stage) => ({
    stage,
    label: STAGE_META[stage].label,
    count: summary.counts[stage],
    color: STAGE_META[stage].color,
  }));
}

export function insight(summary: FunnelSummary): string {
  if (summary.submissions === 0) {
    return "Apply to a few roles to start measuring your response rate.";
  }
  const pct = Math.round((summary.rate ?? 0) * 100);
  if (pct >= 60) {
    return `You hear back on ${pct}% of applications. Keep the pipeline fed while those conversations are warm.`;
  }
  if (pct >= 30) {
    return `${pct}% of submissions get a response. A reminder a week after applying is often the difference.`;
  }
  return `${pct}% response rate so far. Tighten the target list and follow up on anything still sitting in Applied.`;
}

export function percentLabel(rate: number | null): string {
  if (rate === null) return "—";
  return `${Math.round(rate * 100)}%`;
}
