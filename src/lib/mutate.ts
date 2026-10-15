import { todayISO } from "./format";
import type { Application, Note, Reminder } from "./types";
import type { ApplicationInput } from "./validation";

export function createId(): string {
  return globalThis.crypto.randomUUID();
}

export function normalizeApplication(
  input: ApplicationInput,
  now: Date,
  existingAppliedAt = "",
): ApplicationInput {
  const appliedAt =
    input.appliedAt || (input.stage !== "SAVED" ? existingAppliedAt || todayISO(now) : "");
  return { ...input, appliedAt };
}

export function addApplication(apps: Application[], input: ApplicationInput, now = new Date()): Application[] {
  const normalized = normalizeApplication(input, now);
  const position =
    apps.filter((app) => app.stage === normalized.stage).reduce((max, app) => Math.max(max, app.position), -1) + 1;
  const timestamp = now.toISOString();
  const application: Application = {
    id: createId(),
    company: normalized.company,
    role: normalized.role,
    location: normalized.location,
    url: normalized.url,
    salary: normalized.salary,
    stage: normalized.stage,
    source: normalized.source,
    appliedAt: normalized.appliedAt,
    position,
    createdAt: timestamp,
    updatedAt: timestamp,
    notes: [],
    reminders: [],
  };
  return [...apps, application];
}

export function replaceApplication(
  apps: Application[],
  id: string,
  input: ApplicationInput,
  now = new Date(),
): Application[] | null {
  const current = apps.find((app) => app.id === id);
  if (!current) return null;
  const normalized = normalizeApplication(input, now, current.appliedAt);
  let position = current.position;
  if (normalized.stage !== current.stage) {
    position =
      apps
        .filter((app) => app.stage === normalized.stage && app.id !== id)
        .reduce((max, app) => Math.max(max, app.position), -1) + 1;
  }
  return apps.map((app) =>
    app.id === id
      ? {
          ...app,
          ...normalized,
          position,
          updatedAt: now.toISOString(),
        }
      : app,
  );
}

export function removeApplication(apps: Application[], id: string): Application[] | null {
  if (!apps.some((app) => app.id === id)) return null;
  return apps.filter((app) => app.id !== id);
}

export function addNote(apps: Application[], applicationId: string, body: string, now = new Date()): Application[] | null {
  if (!apps.some((app) => app.id === applicationId)) return null;
  const note: Note = {
    id: createId(),
    applicationId,
    body: body.trim(),
    createdAt: now.toISOString(),
  };
  return apps.map((app) => (app.id === applicationId ? { ...app, notes: [...app.notes, note] } : app));
}

export function removeNote(apps: Application[], noteId: string): Application[] | null {
  if (!apps.some((app) => app.notes.some((note) => note.id === noteId))) return null;
  return apps.map((app) => ({ ...app, notes: app.notes.filter((note) => note.id !== noteId) }));
}

export function addReminder(
  apps: Application[],
  applicationId: string,
  input: { title: string; dueAt: string },
  now = new Date(),
): Application[] | null {
  if (!apps.some((app) => app.id === applicationId)) return null;
  const reminder: Reminder = {
    id: createId(),
    applicationId,
    title: input.title.trim(),
    dueAt: new Date(input.dueAt).toISOString(),
    done: false,
  };
  return apps.map((app) =>
    app.id === applicationId
      ? { ...app, reminders: [...app.reminders, reminder].sort((a, b) => a.dueAt.localeCompare(b.dueAt)), updatedAt: now.toISOString() }
      : app,
  );
}

export function setReminderDone(apps: Application[], reminderId: string, done: boolean): Application[] | null {
  if (!apps.some((app) => app.reminders.some((reminder) => reminder.id === reminderId))) return null;
  return apps.map((app) => ({
    ...app,
    reminders: app.reminders.map((reminder) => (reminder.id === reminderId ? { ...reminder, done } : reminder)),
  }));
}

export function removeReminder(apps: Application[], reminderId: string): Application[] | null {
  if (!apps.some((app) => app.reminders.some((reminder) => reminder.id === reminderId))) return null;
  return apps.map((app) => ({ ...app, reminders: app.reminders.filter((reminder) => reminder.id !== reminderId) }));
}

export function importApplications(
  apps: Application[],
  rows: { input: ApplicationInput; notes: string[] }[],
  now = new Date(),
): Application[] {
  let next = apps;
  rows.forEach((row, index) => {
    const stamped = new Date(now.getTime() + index);
    next = addApplication(next, row.input, stamped);
    const created = next[next.length - 1];
    for (const body of row.notes) {
      const withNote = addNote(next, created.id, body, stamped);
      if (withNote) next = withNote;
    }
  });
  return next;
}
