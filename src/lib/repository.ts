import type { Prisma, PrismaClient } from "@prisma/client";
import { parseCsv } from "./csv";
import { todayISO } from "./format";
import { applicationWhere, noteWhere, reminderWhere, requireUserId } from "./isolation";
import { applyMove } from "./kanban";
import { normalizeApplication } from "./mutate";
import { getPrisma } from "./prisma";
import type { ActionResult } from "./result";
import type { Application, Note, Reminder, Stage } from "./types";
import { applicationSchema, firstIssue, noteSchema, reminderSchema } from "./validation";

const include = {
  notes: { orderBy: { createdAt: "asc" as const } },
  reminders: { orderBy: { dueAt: "asc" as const } },
} satisfies Prisma.ApplicationInclude;

type Row = Prisma.ApplicationGetPayload<{ include: typeof include }>;
type Db = PrismaClient;

function fail(error: string, applications: Application[] = []): ActionResult {
  return { ok: false, error, applications };
}

function ok(applications: Application[], extra: Partial<ActionResult> = {}): ActionResult {
  return { ok: true, applications, ...extra };
}

function blank(value: string | null | undefined): string {
  return value ?? "";
}

function dateOnly(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

function toDate(value: string): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export function serializeApplication(row: Row): Application {
  const notes: Note[] = row.notes.map((note) => ({
    id: note.id,
    applicationId: note.applicationId,
    body: note.body,
    createdAt: note.createdAt.toISOString(),
  }));
  const reminders: Reminder[] = row.reminders.map((reminder) => ({
    id: reminder.id,
    applicationId: reminder.applicationId,
    title: reminder.title,
    dueAt: reminder.dueAt.toISOString(),
    done: reminder.done,
  }));
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    location: blank(row.location),
    url: blank(row.url),
    salary: blank(row.salary),
    stage: row.stage as Stage,
    source: blank(row.source),
    appliedAt: dateOnly(row.appliedAt),
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    notes,
    reminders,
  };
}

export async function listApplications(userId: string, db: Db = getPrisma()): Promise<Application[]> {
  const owner = requireUserId(userId);
  const rows = await db.application.findMany({
    where: applicationWhere(owner),
    include,
    orderBy: [{ stage: "asc" }, { position: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(serializeApplication);
}

async function snapshot(userId: string, db: Db): Promise<Application[]> {
  return listApplications(userId, db);
}

export async function createApplication(userId: string, input: unknown, db: Db = getPrisma()): Promise<ActionResult> {
  const owner = requireUserId(userId);
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error), await snapshot(owner, db));
  const data = normalizeApplication(parsed.data, new Date());
  const max = await db.application.aggregate({
    where: { userId: owner, stage: data.stage },
    _max: { position: true },
  });
  await db.application.create({
    data: {
      userId: owner,
      company: data.company,
      role: data.role,
      location: data.location || null,
      url: data.url || null,
      salary: data.salary || null,
      stage: data.stage,
      source: data.source || null,
      appliedAt: toDate(data.appliedAt),
      position: (max._max.position ?? -1) + 1,
    },
  });
  return ok(await snapshot(owner, db));
}

export async function updateApplication(
  userId: string,
  id: string,
  input: unknown,
  db: Db = getPrisma(),
): Promise<ActionResult> {
  const owner = requireUserId(userId);
  const parsed = applicationSchema.safeParse(input);
  const currentList = await snapshot(owner, db);
  if (!parsed.success) return fail(firstIssue(parsed.error), currentList);
  const existing = await db.application.findFirst({ where: applicationWhere(owner, id) });
  if (!existing) return fail("Not found", currentList);
  const data = normalizeApplication(parsed.data, new Date(), dateOnly(existing.appliedAt));
  let position = existing.position;
  if (data.stage !== existing.stage) {
    const max = await db.application.aggregate({
      where: { userId: owner, stage: data.stage, NOT: { id } },
      _max: { position: true },
    });
    position = (max._max.position ?? -1) + 1;
  }
  const updated = await db.application.updateMany({
    where: applicationWhere(owner, id),
    data: {
      company: data.company,
      role: data.role,
      location: data.location || null,
      url: data.url || null,
      salary: data.salary || null,
      stage: data.stage,
      source: data.source || null,
      appliedAt: toDate(data.appliedAt),
      position,
    },
  });
  if (updated.count !== 1) return fail("Not found", currentList);
  return ok(await snapshot(owner, db));
}

export async function deleteApplication(userId: string, id: string, db: Db = getPrisma()): Promise<ActionResult> {
  const owner = requireUserId(userId);
  const deleted = await db.application.deleteMany({ where: applicationWhere(owner, id) });
  const applications = await snapshot(owner, db);
  if (deleted.count !== 1) return fail("Not found", applications);
  return ok(applications);
}

export async function moveApplication(
  userId: string,
  activeId: string,
  overId: string,
  now = new Date(),
  db: Db = getPrisma(),
): Promise<ActionResult> {
  const owner = requireUserId(userId);
  const rows = await db.application.findMany({
    where: applicationWhere(owner),
    select: { id: true, stage: true, position: true, appliedAt: true },
  });
  const movable = rows.map((row) => ({
    id: row.id,
    stage: row.stage as Stage,
    position: row.position,
    appliedAt: dateOnly(row.appliedAt),
  }));
  const next = applyMove(movable, activeId, overId, todayISO(now));
  if (!next) return ok(await snapshot(owner, db));
  const changed = next.filter((item) => {
    const prev = movable.find((row) => row.id === item.id);
    return prev && (prev.stage !== item.stage || prev.position !== item.position || prev.appliedAt !== item.appliedAt);
  });
  await db.$transaction(
    changed.map((item) =>
      db.application.updateMany({
        where: applicationWhere(owner, item.id),
        data: {
          stage: item.stage,
          position: item.position,
          appliedAt: toDate(item.appliedAt),
        },
      }),
    ),
  );
  return ok(await snapshot(owner, db));
}

export async function createNote(
  userId: string,
  applicationId: string,
  input: unknown,
  db: Db = getPrisma(),
): Promise<ActionResult> {
  const owner = requireUserId(userId);
  const parsed = noteSchema.safeParse(input);
  const applications = await snapshot(owner, db);
  if (!parsed.success) return fail(firstIssue(parsed.error), applications);
  const parent = await db.application.findFirst({ where: applicationWhere(owner, applicationId), select: { id: true } });
  if (!parent) return fail("Not found", applications);
  await db.note.create({ data: { applicationId: parent.id, body: parsed.data.body } });
  return ok(await snapshot(owner, db));
}

export async function deleteNote(userId: string, noteId: string, db: Db = getPrisma()): Promise<ActionResult> {
  const owner = requireUserId(userId);
  const deleted = await db.note.deleteMany({ where: noteWhere(owner, noteId) });
  const applications = await snapshot(owner, db);
  if (deleted.count !== 1) return fail("Not found", applications);
  return ok(applications);
}

export async function createReminder(
  userId: string,
  applicationId: string,
  input: unknown,
  db: Db = getPrisma(),
): Promise<ActionResult> {
  const owner = requireUserId(userId);
  const parsed = reminderSchema.safeParse(input);
  const applications = await snapshot(owner, db);
  if (!parsed.success) return fail(firstIssue(parsed.error), applications);
  const parent = await db.application.findFirst({ where: applicationWhere(owner, applicationId), select: { id: true } });
  if (!parent) return fail("Not found", applications);
  await db.reminder.create({
    data: {
      applicationId: parent.id,
      title: parsed.data.title,
      dueAt: new Date(parsed.data.dueAt),
    },
  });
  return ok(await snapshot(owner, db));
}

export async function setReminderDone(
  userId: string,
  reminderId: string,
  done: boolean,
  db: Db = getPrisma(),
): Promise<ActionResult> {
  const owner = requireUserId(userId);
  const updated = await db.reminder.updateMany({ where: reminderWhere(owner, reminderId), data: { done } });
  const applications = await snapshot(owner, db);
  if (updated.count !== 1) return fail("Not found", applications);
  return ok(applications);
}

export async function deleteReminder(userId: string, reminderId: string, db: Db = getPrisma()): Promise<ActionResult> {
  const owner = requireUserId(userId);
  const deleted = await db.reminder.deleteMany({ where: reminderWhere(owner, reminderId) });
  const applications = await snapshot(owner, db);
  if (deleted.count !== 1) return fail("Not found", applications);
  return ok(applications);
}

export async function importCsv(userId: string, csv: string, db: Db = getPrisma()): Promise<ActionResult> {
  const owner = requireUserId(userId);
  const parsed = parseCsv(csv);
  if (parsed.rows.length === 0) {
    return fail(parsed.errors[0] ?? "No rows to import", await snapshot(owner, db));
  }
  await db.$transaction(async (tx) => {
    for (const row of parsed.rows) {
      const data = normalizeApplication(row.input, new Date());
      const max = await tx.application.aggregate({
        where: { userId: owner, stage: data.stage },
        _max: { position: true },
      });
      await tx.application.create({
        data: {
          userId: owner,
          company: data.company,
          role: data.role,
          location: data.location || null,
          url: data.url || null,
          salary: data.salary || null,
          stage: data.stage,
          source: data.source || null,
          appliedAt: toDate(data.appliedAt),
          position: (max._max.position ?? -1) + 1,
          notes: { create: row.notes.map((body) => ({ body })) },
        },
      });
    }
  });
  return ok(await snapshot(owner, db), { imported: parsed.rows.length, rowErrors: parsed.errors });
}
