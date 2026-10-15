import { isStage, STAGES, type Application, type Stage } from "./types";

interface Movable {
  id: string;
  stage: Stage;
  position: number;
  appliedAt: string;
}

/**
 * Drop semantics match dnd-kit's arrayMove within a column.
 * Across columns, `overId` of a card inserts before that card; a column id appends.
 * Leaving Saved stamps `today` into appliedAt when it is still empty.
 * Returns null when nothing changes.
 */
export function applyMove<T extends Movable>(
  apps: T[],
  activeId: string,
  overId: string,
  today: string,
): T[] | null {
  if (!activeId || activeId === overId) return null;
  const active = apps.find((app) => app.id === activeId);
  if (!active) return null;

  const grouped = new Map<Stage, T[]>();
  for (const stage of STAGES) grouped.set(stage, []);
  const ordered = [...apps].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  for (const app of ordered) grouped.get(app.stage)!.push(app);

  const fromStage = active.stage;
  const source = grouped.get(fromStage)!;
  let toStage: Stage;
  let toIndex: number;

  if (isStage(overId)) {
    toStage = overId;
    toIndex = toStage === fromStage ? Math.max(0, source.length - 1) : grouped.get(toStage)!.length;
  } else {
    const over = apps.find((app) => app.id === overId);
    if (!over) return null;
    toStage = over.stage;
    toIndex = grouped.get(toStage)!.findIndex((app) => app.id === over.id);
    if (toIndex < 0) return null;
  }

  let nextSource: T[];
  let nextTarget: T[] | null = null;

  if (toStage === fromStage) {
    const fromIndex = source.findIndex((app) => app.id === activeId);
    if (fromIndex < 0 || fromIndex === toIndex) return null;
    nextSource = arrayMove(source, fromIndex, toIndex);
  } else {
    nextSource = source.filter((app) => app.id !== activeId);
    const moved = {
      ...active,
      stage: toStage,
      appliedAt: toStage !== "SAVED" && !active.appliedAt ? today : active.appliedAt,
    } as T;
    nextTarget = [...grouped.get(toStage)!];
    nextTarget.splice(Math.max(0, Math.min(toIndex, nextTarget.length)), 0, moved);
  }

  const updates = new Map<string, T>();
  const stamp = (column: T[], stage: Stage) => {
    column.forEach((app, position) => {
      const next = { ...app, stage, position };
      const prev = apps.find((item) => item.id === app.id)!;
      if (prev.stage !== next.stage || prev.position !== next.position || prev.appliedAt !== next.appliedAt) {
        updates.set(app.id, next);
      }
    });
  };

  stamp(nextSource, fromStage);
  if (nextTarget) stamp(nextTarget, toStage);
  if (updates.size === 0) return null;
  return apps.map((app) => updates.get(app.id) ?? app);
}

export function appsInStage(apps: Application[], stage: Stage, query = ""): Application[] {
  const needle = query.trim().toLowerCase();
  return apps
    .filter((app) => app.stage === stage)
    .filter((app) => {
      if (!needle) return true;
      return [app.company, app.role, app.location, app.source, app.salary]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    })
    .sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));
}

function arrayMove<T>(items: T[], from: number, to: number): T[] {
  const next = items.slice();
  const [item] = next.splice(from, 1);
  if (!item) return items;
  next.splice(to, 0, item);
  return next;
}
