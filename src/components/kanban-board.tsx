"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bell, StickyNote } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { appsInStage } from "@/lib/kanban";
import { formatApplied } from "@/lib/format";
import { STAGES, STAGE_META, type Application, type Stage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function KanbanBoard({
  applications,
  query,
  onOpen,
  onMove,
}: {
  applications: Application[];
  query: string;
  onOpen: (id: string) => void;
  onMove: (activeId: string, overId: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const active = applications.find((app) => app.id === activeId) ?? null;
  const searching = query.trim().length > 0;

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (searching || !event.over) return;
    onMove(String(event.active.id), String(event.over.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {searching ? (
        <p className="mb-3 text-sm text-muted-foreground">Clear search to drag cards between stages.</p>
      ) : null}
      <div className="flex gap-3 overflow-x-auto pb-4 xl:grid xl:grid-cols-5 xl:overflow-visible">
        {STAGES.map((stage) => (
          <Column
            key={stage}
            stage={stage}
            apps={appsInStage(applications, stage, query)}
            disabled={searching}
            onOpen={onOpen}
          />
        ))}
      </div>
      <DragOverlay>
        {active ? (
          <article className="w-[240px] rotate-1 rounded-xl border bg-card p-3 shadow-card">
            <CardBody app={active} />
          </article>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  stage,
  apps,
  disabled,
  onOpen,
}: {
  stage: Stage;
  apps: Application[];
  disabled: boolean;
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage, disabled });
  const meta = STAGE_META[stage];
  return (
    <section
      ref={setNodeRef}
      data-testid={`column-${stage}`}
      aria-label={`${meta.label} column`}
      className={cn(
          "flex w-[82vw] shrink-0 flex-col rounded-2xl border sm:w-[260px] xl:w-auto",
          isOver && "ring-2 ring-copper/40",
        )}
      style={{ background: meta.tint }}
    >
      <header className="flex items-center gap-2 px-3 py-3">
        <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} aria-hidden />
        <h2 className="text-sm font-semibold">{meta.label}</h2>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{apps.length}</span>
      </header>
      <SortableContext items={apps.map((app) => app.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-[24rem] flex-col gap-2 px-2 pb-3">
          {apps.length === 0 ? (
            <p className="m-1 rounded-xl border border-dashed px-3 py-8 text-center text-xs text-muted-foreground">
              Drop a role here
            </p>
          ) : (
            apps.map((app) => <ApplicationCard key={app.id} app={app} disabled={disabled} onOpen={onOpen} />)
          )}
        </div>
      </SortableContext>
    </section>
  );
}

function ApplicationCard({
  app,
  disabled,
  onOpen,
}: {
  app: Application;
  disabled: boolean;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app.id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-full rounded-xl border bg-card p-3 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "opacity-40",
      )}
      onClick={() => onOpen(app.id)}
      data-testid={`card-${app.id}`}
      data-company={app.company}
      aria-label={`${app.company}, ${app.role}`}
      {...attributes}
      {...listeners}
    >
      <CardBody app={app} />
    </button>
  );
}

function CardBody({ app }: { app: Application }) {
  const openReminders = app.reminders.filter((reminder) => !reminder.done).length;
  return (
    <div>
      <div className="flex items-start gap-2.5">
        <Mark name={app.company} />
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg leading-tight">{app.company}</h3>
          <p className="truncate text-sm text-muted-foreground">{app.role}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {app.location ? <span className="text-xs text-muted-foreground">{app.location}</span> : null}
        {app.source ? <Badge variant="outline">{app.source}</Badge> : null}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        {app.appliedAt ? <span>{formatApplied(app.appliedAt)}</span> : <span>Not applied</span>}
        {app.notes.length > 0 ? (
          <span className="inline-flex items-center gap-1">
            <StickyNote className="h-3 w-3" aria-hidden />
            {app.notes.length}
          </span>
        ) : null}
        {openReminders > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Bell className="h-3 w-3" aria-hidden />
            {openReminders}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Mark({ name }: { name: string }) {
  const hue = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[11px] font-semibold"
      style={{ background: `hsl(${hue} 42% 92%)`, color: `hsl(${hue} 32% 28%)` }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
