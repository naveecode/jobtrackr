"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import * as repo from "@/lib/repository";
import type { ActionResult } from "@/lib/result";

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function run(task: (userId: string) => Promise<ActionResult>): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Unauthorized", applications: [] };
  const result = await task(userId);
  if (result.ok) revalidatePath("/board");
  return result;
}

export async function createApplicationAction(input: unknown) {
  return run((userId) => repo.createApplication(userId, input));
}

export async function updateApplicationAction(id: string, input: unknown) {
  return run((userId) => repo.updateApplication(userId, id, input));
}

export async function deleteApplicationAction(id: string) {
  return run((userId) => repo.deleteApplication(userId, id));
}

export async function moveApplicationAction(activeId: string, overId: string) {
  return run((userId) => repo.moveApplication(userId, activeId, overId));
}

export async function createNoteAction(applicationId: string, body: string) {
  return run((userId) => repo.createNote(userId, applicationId, { body }));
}

export async function deleteNoteAction(noteId: string) {
  return run((userId) => repo.deleteNote(userId, noteId));
}

export async function createReminderAction(applicationId: string, input: { title: string; dueAt: string }) {
  return run((userId) => repo.createReminder(userId, applicationId, input));
}

export async function setReminderDoneAction(reminderId: string, done: boolean) {
  return run((userId) => repo.setReminderDone(userId, reminderId, done));
}

export async function deleteReminderAction(reminderId: string) {
  return run((userId) => repo.deleteReminder(userId, reminderId));
}

export async function importCsvAction(csv: string) {
  return run((userId) => repo.importCsv(userId, csv));
}
