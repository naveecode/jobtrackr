"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Tracker } from "@/components/tracker";
import { parseCsv } from "@/lib/csv";
import { freshDemoState, loadDemoState, saveDemoState } from "@/lib/demo-store";
import { applyMove } from "@/lib/kanban";
import { addApplication, addNote, addReminder, importApplications, removeApplication, removeNote, removeReminder, replaceApplication, setReminderDone } from "@/lib/mutate";
import type { Application } from "@/lib/types";
import { applicationSchema, firstIssue, noteSchema, reminderSchema } from "@/lib/validation";

export function DemoTracker() {
  const [applications, setApplications] = useState<Application[] | null>(null);
  const appsRef = useRef<Application[]>([]);

  useEffect(() => {
    const existing = loadDemoState();
    const initial = existing ?? freshDemoState();
    if (!existing) saveDemoState(initial);
    appsRef.current = initial;
    setApplications(initial);
  }, []);

  function commit(updater: (current: Application[]) => Application[] | null): string | null {
    const next = updater(appsRef.current);
    if (!next) return "Not found";
    appsRef.current = next;
    setApplications(next);
    saveDemoState(next);
    return null;
  }

  if (!applications) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="font-display text-3xl">Jobtrackr</p>
      </div>
    );
  }

  return (
    <Tracker
      mode="demo"
      applications={applications}
      onCreate={async (input) => {
        const parsed = applicationSchema.safeParse(input);
        if (!parsed.success) return firstIssue(parsed.error);
        return commit((current) => addApplication(current, parsed.data));
      }}
      onUpdate={async (id, input) => {
        const parsed = applicationSchema.safeParse(input);
        if (!parsed.success) return firstIssue(parsed.error);
        return commit((current) => replaceApplication(current, id, parsed.data));
      }}
      onDelete={async (id) => commit((current) => removeApplication(current, id))}
      onMove={async (activeId, overId) => {
        const today = new Date().toISOString().slice(0, 10);
        return commit((current) => applyMove(current, activeId, overId, today) ?? current);
      }}
      onAddNote={async (applicationId, body) => {
        const parsed = noteSchema.safeParse({ body });
        if (!parsed.success) return firstIssue(parsed.error);
        return commit((current) => addNote(current, applicationId, parsed.data.body));
      }}
      onDeleteNote={async (noteId) => commit((current) => removeNote(current, noteId))}
      onAddReminder={async (applicationId, input) => {
        const parsed = reminderSchema.safeParse(input);
        if (!parsed.success) return firstIssue(parsed.error);
        return commit((current) => addReminder(current, applicationId, parsed.data));
      }}
      onToggleReminder={async (reminderId, done) => commit((current) => setReminderDone(current, reminderId, done))}
      onDeleteReminder={async (reminderId) => commit((current) => removeReminder(current, reminderId))}
      onImport={async (csv) => {
        const parsed = parseCsv(csv);
        if (parsed.rows.length === 0) {
          return { imported: 0, errors: parsed.errors.length ? parsed.errors : ["No rows to import."] };
        }
        commit((current) => importApplications(current, parsed.rows));
        return { imported: parsed.rows.length, errors: parsed.errors };
      }}
      onReset={() => {
        const fresh = freshDemoState();
        appsRef.current = fresh;
        setApplications(fresh);
        saveDemoState(fresh);
        toast.success("Sample data restored");
      }}
    />
  );
}
