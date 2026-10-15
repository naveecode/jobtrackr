"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ApplicationForm } from "@/components/application-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatDue, isOverdue } from "@/lib/format";
import type { Application } from "@/lib/types";
import type { ApplicationInput } from "@/lib/validation";
import { noteSchema, reminderSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";

export function ApplicationSheet({
  application,
  onClose,
  onUpdate,
  onDelete,
  onAddNote,
  onDeleteNote,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
}: {
  application: Application | null;
  onClose: () => void;
  onUpdate: (id: string, input: ApplicationInput) => Promise<string | null>;
  onDelete: (id: string) => Promise<string | null>;
  onAddNote: (applicationId: string, body: string) => Promise<string | null>;
  onDeleteNote: (noteId: string) => Promise<string | null>;
  onAddReminder: (applicationId: string, input: { title: string; dueAt: string }) => Promise<string | null>;
  onToggleReminder: (reminderId: string, done: boolean) => Promise<string | null>;
  onDeleteReminder: (reminderId: string) => Promise<string | null>;
}) {
  return (
    <Sheet open={Boolean(application)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent data-testid="application-sheet">
        {application ? (
          <SheetBody
            key={application.id}
            application={application}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onAddNote={onAddNote}
            onDeleteNote={onDeleteNote}
            onAddReminder={onAddReminder}
            onToggleReminder={onToggleReminder}
            onDeleteReminder={onDeleteReminder}
            onClose={onClose}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({
  application,
  onUpdate,
  onDelete,
  onAddNote,
  onDeleteNote,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onClose,
}: {
  application: Application;
  onClose: () => void;
  onUpdate: (id: string, input: ApplicationInput) => Promise<string | null>;
  onDelete: (id: string) => Promise<string | null>;
  onAddNote: (applicationId: string, body: string) => Promise<string | null>;
  onDeleteNote: (noteId: string) => Promise<string | null>;
  onAddReminder: (applicationId: string, input: { title: string; dueAt: string }) => Promise<string | null>;
  onToggleReminder: (reminderId: string, done: boolean) => Promise<string | null>;
  onDeleteReminder: (reminderId: string) => Promise<string | null>;
}) {
  const [note, setNote] = useState("");
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function saveNote(event: FormEvent) {
    event.preventDefault();
    const parsed = noteSchema.safeParse({ body: note });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Write a note");
      return;
    }
    const error = await onAddNote(application.id, parsed.data.body);
    if (error) toast.error(error);
    else setNote("");
  }

  async function saveReminder(event: FormEvent) {
    event.preventDefault();
    const parsed = reminderSchema.safeParse({ title, dueAt });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the reminder");
      return;
    }
    const error = await onAddReminder(application.id, parsed.data);
    if (error) toast.error(error);
    else {
      setTitle("");
      setDueAt("");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-5">
        <SheetHeader>
          <SheetTitle>{application.company}</SheetTitle>
          <p className="text-sm text-muted-foreground">{application.role}</p>
        </SheetHeader>
      </div>
      <div className="flex-1 space-y-8 overflow-y-auto px-6 py-5">
        <ApplicationForm
          key={`${application.id}-${application.updatedAt}`}
          initial={application}
          idPrefix="edit"
          submitLabel="Save changes"
          onSubmit={async (input) => {
            const error = await onUpdate(application.id, input);
            if (!error) toast.success("Saved");
            return error;
          }}
        />
        {application.url ? (
          <a className="text-sm text-copper underline-offset-4 hover:underline" href={application.url} target="_blank" rel="noreferrer">
            Open job posting
          </a>
        ) : null}

        <section className="space-y-3">
          <h3 className="font-display text-xl">Notes</h3>
          <ul className="space-y-2">
            {application.notes.length === 0 ? <li className="text-sm text-muted-foreground">No notes yet.</li> : null}
            {application.notes.map((item) => (
              <li key={item.id} className="rounded-xl border bg-paper/60 px-3 py-2 text-sm" data-testid={`note-${item.id}`}>
                <p className="whitespace-pre-wrap">{item.body}</p>
                <button type="button" className="mt-1 text-xs text-muted-foreground hover:text-destructive" onClick={() => onDeleteNote(item.id)}>
                  Delete note
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={saveNote} className="space-y-2" data-testid="note-form">
            <Textarea
              data-testid="note-input"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What did you learn from this conversation?"
            />
            <Button type="submit" size="sm" variant="secondary" data-testid="save-note">
              Add note
            </Button>
          </form>
        </section>

        <section className="space-y-3">
          <h3 className="font-display text-xl">Reminders</h3>
          <ul className="space-y-2">
            {application.reminders.length === 0 ? <li className="text-sm text-muted-foreground">No reminders yet.</li> : null}
            {application.reminders.map((item) => (
              <li key={item.id} className="flex items-start gap-2 rounded-xl border px-3 py-2" data-testid={`reminder-${item.id}`}>
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={item.done}
                  aria-label={`Mark “${item.title}” done`}
                  onChange={(event) => onToggleReminder(item.id, event.target.checked)}
                />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", item.done && "text-muted-foreground line-through")}>{item.title}</p>
                  <p className={cn("text-xs", !item.done && isOverdue(item.dueAt) ? "text-destructive" : "text-muted-foreground")}>
                    {formatDue(item.dueAt)}
                  </p>
                </div>
                <button type="button" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => onDeleteReminder(item.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={saveReminder} className="grid gap-2 sm:grid-cols-[1fr_auto]" data-testid="reminder-form">
            <Input
              data-testid="reminder-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Follow up"
            />
            <Input data-testid="reminder-due" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
            <Button type="submit" size="sm" variant="secondary" data-testid="save-reminder" className="sm:col-span-2 sm:justify-self-start">
              Add reminder
            </Button>
          </form>
        </section>

        <section className="rounded-xl border border-destructive/30 p-4">
          {confirming ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm">This removes the notes and reminders too.</p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                data-testid="confirm-delete"
                onClick={async () => {
                  const error = await onDelete(application.id);
                  if (error) toast.error(error);
                  else onClose();
                }}
              >
                Confirm delete
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" data-testid="delete-application" onClick={() => setConfirming(true)}>
              Delete application
            </Button>
          )}
        </section>
      </div>
    </div>
  );
}
