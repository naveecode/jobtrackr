"use client";

import { Download, Plus, Search, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AnalyticsView } from "@/components/analytics-view";
import { ApplicationForm } from "@/components/application-form";
import { ApplicationSheet } from "@/components/application-sheet";
import { KanbanBoard } from "@/components/kanban-board";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { applicationsToCsv } from "@/lib/csv";
import { formatDue, isOverdue } from "@/lib/format";
import { percentLabel, summarize } from "@/lib/funnel";
import type { Application } from "@/lib/types";
import type { ApplicationInput } from "@/lib/validation";

export interface TrackerProps {
  mode: "demo" | "account";
  user?: { name?: string | null; email?: string | null };
  applications: Application[];
  onCreate: (input: ApplicationInput) => Promise<string | null>;
  onUpdate: (id: string, input: ApplicationInput) => Promise<string | null>;
  onDelete: (id: string) => Promise<string | null>;
  onMove: (activeId: string, overId: string) => Promise<string | null>;
  onAddNote: (applicationId: string, body: string) => Promise<string | null>;
  onDeleteNote: (noteId: string) => Promise<string | null>;
  onAddReminder: (applicationId: string, input: { title: string; dueAt: string }) => Promise<string | null>;
  onToggleReminder: (reminderId: string, done: boolean) => Promise<string | null>;
  onDeleteReminder: (reminderId: string) => Promise<string | null>;
  onImport: (csv: string) => Promise<{ imported: number; errors: string[] }>;
  onReset?: () => void;
  signOutAction?: () => Promise<void>;
}

export function Tracker(props: TrackerProps) {
  const { applications } = props;
  const [view, setView] = useState<"board" | "analytics">("board");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const summary = summarize(applications);
  const selected = applications.find((app) => app.id === selectedId) ?? null;
  const reminders = applications
    .flatMap((app) => app.reminders.filter((reminder) => !reminder.done).map((reminder) => ({ ...reminder, company: app.company, applicationId: app.id })))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, 3);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;
      event.preventDefault();
      document.getElementById("pipeline-search")?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function exportCsv() {
    const csv = applicationsToCsv(applications);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "jobtrackr-applications.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(file: File) {
    const text = await file.text();
    const result = await props.onImport(text);
    if (result.imported > 0) {
      toast.success(`Imported ${result.imported} application${result.imported === 1 ? "" : "s"}`);
    }
    if (result.errors.length > 0) {
      toast.error(result.errors.slice(0, 3).join(" "));
    } else if (result.imported === 0) {
      toast.error("Nothing was imported");
    }
  }

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-3 px-4 py-3">
          <Wordmark />
          <div className="flex rounded-lg border bg-card p-0.5" role="tablist" aria-label="Views">
            <button
              type="button"
              role="tab"
              aria-selected={view === "board"}
              data-testid="view-board"
              className={tabClass(view === "board")}
              onClick={() => setView("board")}
            >
              Board
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "analytics"}
              data-testid="view-analytics"
              className={tabClass(view === "analytics")}
              onClick={() => setView("analytics")}
            >
              Analytics
            </button>
          </div>
          <div className="relative ml-auto min-w-[12rem] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="pipeline-search"
              data-testid="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company or role"
              className="pl-9"
              aria-label="Search applications"
            />
          </div>
          <input
            ref={fileRef}
            data-testid="import-csv"
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importFile(file);
              event.target.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" aria-hidden />
            Import
          </Button>
          <Button type="button" variant="outline" size="sm" data-testid="export-csv" onClick={exportCsv}>
            <Download className="h-4 w-4" aria-hidden />
            Export
          </Button>
          <Button
            type="button"
            size="sm"
            data-testid="add-application"
            onClick={() => {
              setCreateKey((value) => value + 1);
              setCreating(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add
          </Button>
          {props.mode === "account" && props.signOutAction ? (
            <form action={props.signOutAction} className="flex items-center gap-2">
              <span className="hidden max-w-[12rem] truncate text-sm text-muted-foreground md:inline">
                {props.user?.name || props.user?.email}
              </span>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          ) : (
            <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-paper">Demo</span>
          )}
        </div>
      </header>

      <main id="main" className="mx-auto flex max-w-[1680px] flex-col gap-4 px-4 py-5">
        {props.mode === "demo" ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-copper/20 bg-card/80 px-4 py-2.5 text-sm">
            <p>
              <span className="font-medium">Demo mode.</span> This sample search stays in this browser. Nothing is uploaded and no account is required.
            </p>
            <Button type="button" variant="outline" size="sm" data-testid="reset-demo" onClick={props.onReset}>
              Reset sample data
            </Button>
          </div>
        ) : null}

        <section className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card/70 px-4 py-3">
          <RateRing rate={summary.rate} />
          <Metric label="Tracked" value={String(summary.total)} />
          <Metric label="Submitted" value={String(summary.submissions)} />
          <Metric label="Interviews" value={String(summary.counts.INTERVIEW)} />
          <Metric label="Offers" value={String(summary.counts.OFFER)} />
          <div className="ml-auto flex min-w-[16rem] flex-1 flex-wrap justify-end gap-2">
            {reminders.length === 0 ? (
              <p className="self-center text-sm text-muted-foreground">No open reminders</p>
            ) : (
              reminders.map((reminder) => (
                <button
                  key={reminder.id}
                  type="button"
                  data-testid="reminder-chip"
                  onClick={() => {
                    setView("board");
                    setSelectedId(reminder.applicationId);
                  }}
                  className={`rounded-full border px-3 py-1 text-left text-xs ${isOverdue(reminder.dueAt) ? "border-destructive/40 text-destructive" : "bg-background"}`}
                >
                  <span className="font-medium">{reminder.company}</span>
                  <span className="mx-1 text-muted-foreground">·</span>
                  {reminder.title}
                  <span className="ml-1 text-muted-foreground">{formatDue(reminder.dueAt)}</span>
                </button>
              ))
            )}
          </div>
        </section>

        {applications.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed bg-card/50 px-6 py-20 text-center">
            <div className="max-w-md">
              <h1 className="font-display text-4xl">Your search, in one place.</h1>
              <p className="mt-2 text-sm text-muted-foreground">Add a role, import a spreadsheet, or restore the sample pipeline.</p>
              <div className="mt-5 flex justify-center gap-2">
                <Button type="button" onClick={() => setCreating(true)}>
                  Add an application
                </Button>
                {props.onReset ? (
                  <Button type="button" variant="outline" onClick={props.onReset}>
                    Restore sample data
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : view === "board" ? (
          <KanbanBoard applications={applications} query={query} onOpen={setSelectedId} onMove={(activeId, overId) => void props.onMove(activeId, overId)} />
        ) : (
          <AnalyticsView applications={query ? applications.filter((app) => matches(app, query)) : applications} />
        )}
      </main>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New application</DialogTitle>
            <DialogDescription>Saved roles can stay undated until you actually apply.</DialogDescription>
          </DialogHeader>
          <ApplicationForm
            key={createKey}
            idPrefix="create"
            submitLabel="Add application"
            onSubmit={async (input) => {
              const error = await props.onCreate(input);
              if (!error) {
                toast.success(`${input.company} added`);
                setCreating(false);
              }
              return error;
            }}
          />
        </DialogContent>
      </Dialog>

      <ApplicationSheet
        application={selected}
        onClose={() => setSelectedId(null)}
        onUpdate={props.onUpdate}
        onDelete={props.onDelete}
        onAddNote={props.onAddNote}
        onDeleteNote={props.onDeleteNote}
        onAddReminder={props.onAddReminder}
        onToggleReminder={props.onToggleReminder}
        onDeleteReminder={props.onDeleteReminder}
      />
    </div>
  );
}

function matches(app: Application, query: string) {
  const needle = query.trim().toLowerCase();
  return [app.company, app.role, app.location, app.source].join(" ").toLowerCase().includes(needle);
}

function tabClass(active: boolean) {
  return `rounded-md px-3 py-1.5 text-sm ${active ? "bg-ink text-paper" : "text-muted-foreground hover:text-foreground"}`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="font-display text-2xl leading-none">{value}</p>
    </div>
  );
}

function RateRing({ rate }: { rate: number | null }) {
  const pct = rate == null ? 0 : Math.round(rate * 100);
  return (
    <div className="flex items-center gap-3" data-testid="response-rate" data-rate={rate == null ? "" : String(rate)}>
      <div
        className="grid h-14 w-14 place-items-center rounded-full"
        style={{ background: `conic-gradient(#c2410c ${pct * 3.6}deg, #e7e1d6 0deg)` }}
        aria-hidden
      >
        <div className="grid h-10 w-10 place-items-center rounded-full bg-card text-xs font-semibold">{rate == null ? "—" : `${pct}%`}</div>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Response rate</p>
        <p className="text-sm text-muted-foreground">Replies on submitted roles</p>
      </div>
    </div>
  );
}
