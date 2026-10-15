import { z } from "zod";
import { isISODate } from "./format";
import { STAGES } from "./types";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const applicationSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(120, "Company is too long"),
  role: z.string().trim().min(1, "Role is required").max(160, "Role is too long"),
  location: z.string().trim().max(120, "Location is too long").default(""),
  url: z
    .string()
    .trim()
    .max(500)
    .default("")
    .refine((value) => value === "" || isHttpUrl(value), "Enter a valid http(s) URL"),
  salary: z.string().trim().max(80, "Salary is too long").default(""),
  stage: z.enum(STAGES, { errorMap: () => ({ message: "Choose a stage" }) }),
  source: z.string().trim().max(80, "Source is too long").default(""),
  appliedAt: z
    .string()
    .trim()
    .default("")
    .refine((value) => value === "" || isISODate(value), "Use a real date as YYYY-MM-DD"),
});

export const noteSchema = z.object({
  body: z.string().trim().min(1, "Write a note").max(4000, "Note is too long"),
});

export const reminderSchema = z.object({
  title: z.string().trim().min(1, "Add a reminder title").max(200, "Title is too long"),
  dueAt: z
    .string()
    .trim()
    .min(1, "Pick a date and time")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date and time"),
});

export const emailSchema = z.string().trim().email("Enter a valid email");

export type ApplicationInput = z.output<typeof applicationSchema>;
export type NoteInput = z.output<typeof noteSchema>;
export type ReminderInput = z.output<typeof reminderSchema>;

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
