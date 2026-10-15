export const STAGES = ["SAVED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_META: Record<
  Stage,
  { label: string; description: string; color: string; tint: string }
> = {
  SAVED: {
    label: "Saved",
    description: "Roles to come back to",
    color: "#78716c",
    tint: "#f6f4f1",
  },
  APPLIED: {
    label: "Applied",
    description: "Waiting to hear back",
    color: "#0369a1",
    tint: "#f3f8fc",
  },
  INTERVIEW: {
    label: "Interview",
    description: "Conversations in progress",
    color: "#b45309",
    tint: "#fdf8f1",
  },
  OFFER: {
    label: "Offer",
    description: "Decisions to make",
    color: "#047857",
    tint: "#f2faf6",
  },
  REJECTED: {
    label: "Rejected",
    description: "Closed, with the notes kept",
    color: "#be123c",
    tint: "#fdf5f6",
  },
};

export interface Note {
  id: string;
  applicationId: string;
  body: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  applicationId: string;
  title: string;
  dueAt: string;
  done: boolean;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  location: string;
  url: string;
  salary: string;
  stage: Stage;
  source: string;
  appliedAt: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  notes: Note[];
  reminders: Reminder[];
}

export function isStage(value: string): value is Stage {
  return (STAGES as readonly string[]).includes(value);
}
