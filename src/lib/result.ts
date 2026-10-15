import type { Application } from "./types";

export interface ActionResult {
  ok: boolean;
  error?: string;
  applications: Application[];
  imported?: number;
  rowErrors?: string[];
}
