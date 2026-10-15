"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  createApplicationAction,
  createNoteAction,
  createReminderAction,
  deleteApplicationAction,
  deleteNoteAction,
  deleteReminderAction,
  importCsvAction,
  moveApplicationAction,
  setReminderDoneAction,
  updateApplicationAction,
} from "@/actions/applications";
import { signOutAction } from "@/actions/auth";
import { Tracker } from "@/components/tracker";
import type { ActionResult } from "@/lib/result";
import type { Application } from "@/lib/types";

export function AuthedTracker({
  initial,
  user,
}: {
  initial: Application[];
  user: { name?: string | null; email?: string | null };
}) {
  const [applications, setApplications] = useState(initial);

  async function settle(result: ActionResult): Promise<string | null> {
    setApplications(result.applications);
    if (!result.ok) {
      toast.error(result.error ?? "Something went wrong");
      return result.error ?? "Something went wrong";
    }
    return null;
  }

  return (
    <Tracker
      mode="account"
      user={user}
      applications={applications}
      signOutAction={signOutAction}
      onCreate={(input) => createApplicationAction(input).then(settle)}
      onUpdate={(id, input) => updateApplicationAction(id, input).then(settle)}
      onDelete={(id) => deleteApplicationAction(id).then(settle)}
      onMove={(activeId, overId) => moveApplicationAction(activeId, overId).then(settle)}
      onAddNote={(applicationId, body) => createNoteAction(applicationId, body).then(settle)}
      onDeleteNote={(noteId) => deleteNoteAction(noteId).then(settle)}
      onAddReminder={(applicationId, input) => createReminderAction(applicationId, input).then(settle)}
      onToggleReminder={(reminderId, done) => setReminderDoneAction(reminderId, done).then(settle)}
      onDeleteReminder={(reminderId) => deleteReminderAction(reminderId).then(settle)}
      onImport={async (csv) => {
        const result = await importCsvAction(csv);
        setApplications(result.applications);
        return {
          imported: result.imported ?? 0,
          errors: result.ok ? (result.rowErrors ?? []) : [result.error ?? "Import failed"],
        };
      }}
    />
  );
}
