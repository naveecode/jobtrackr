import { seedApplications } from "./seed";
import type { Application } from "./types";

export const DEMO_STORAGE_KEY = "jobtrackr.demo.v1";

export function loadDemoState(): Application[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { applications?: Application[] };
    if (!Array.isArray(parsed.applications)) return null;
    return parsed.applications;
  } catch {
    return null;
  }
}

export function saveDemoState(applications: Application[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ applications }));
}

export function freshDemoState(): Application[] {
  return seedApplications();
}
