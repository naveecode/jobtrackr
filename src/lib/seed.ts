import { daysFromNow, monthsAgo } from "./format";
import type { Application, Note, Reminder, Stage } from "./types";

interface SeedDraft {
  id: string;
  company: string;
  role: string;
  location: string;
  url: string;
  salary: string;
  stage: Stage;
  source: string;
  appliedMonthsAgo?: number;
  appliedDay?: number;
  position: number;
  notes?: string[];
  reminders?: { title: string; days: number }[];
}

const DRAFTS: SeedDraft[] = [
  {
    id: "seed-vercel",
    company: "Vercel",
    role: "Senior Frontend Engineer",
    location: "Remote",
    url: "https://vercel.com/careers",
    salary: "$210k–$240k",
    stage: "OFFER",
    source: "Referral",
    appliedMonthsAgo: 5,
    appliedDay: 4,
    position: 0,
    notes: ["Onsite went well. Comp conversation is on the calendar.", "Team matches the Next.js work I already do."],
    reminders: [{ title: "Review the offer letter", days: 1 }],
  },
  {
    id: "seed-stripe",
    company: "Stripe",
    role: "Product Engineer",
    location: "South San Francisco",
    url: "https://stripe.com/jobs",
    salary: "$190k–$230k",
    stage: "INTERVIEW",
    source: "Recruiter",
    appliedMonthsAgo: 1,
    appliedDay: 12,
    position: 0,
    notes: ["Recruiter screen done. Panel is next week."],
    reminders: [{ title: "Send a thank-you to the panel", days: 2 }],
  },
  {
    id: "seed-figma",
    company: "Figma",
    role: "Software Engineer, Design Systems",
    location: "San Francisco",
    url: "https://www.figma.com/careers",
    salary: "$185k–$220k",
    stage: "INTERVIEW",
    source: "Company site",
    appliedMonthsAgo: 0,
    appliedDay: 3,
    position: 1,
    notes: ["Hiring manager liked the component audit write-up."],
  },
  {
    id: "seed-openai",
    company: "OpenAI",
    role: "Frontend Engineer",
    location: "San Francisco",
    url: "https://openai.com/careers",
    salary: "",
    stage: "INTERVIEW",
    source: "Referral",
    appliedMonthsAgo: 2,
    appliedDay: 18,
    position: 2,
    notes: ["Take-home reviewed. Waiting on the loop schedule."],
  },
  {
    id: "seed-notion",
    company: "Notion",
    role: "Full Stack Engineer",
    location: "New York",
    url: "https://www.notion.com/careers",
    salary: "$180k–$210k",
    stage: "APPLIED",
    source: "Referral",
    appliedMonthsAgo: 0,
    appliedDay: 8,
    position: 0,
    notes: ["Applied via Priya. She is on the editor team."],
    reminders: [{ title: "Check the application portal", days: 5 }],
  },
  {
    id: "seed-linear",
    company: "Linear",
    role: "Product Engineer",
    location: "Remote",
    url: "https://linear.app/careers",
    salary: "",
    stage: "APPLIED",
    source: "Company site",
    appliedMonthsAgo: 1,
    appliedDay: 6,
    position: 1,
  },
  {
    id: "seed-ramp",
    company: "Ramp",
    role: "Senior Frontend Engineer",
    location: "New York",
    url: "https://ramp.com/careers",
    salary: "$175k–$205k",
    stage: "APPLIED",
    source: "LinkedIn",
    appliedMonthsAgo: 2,
    appliedDay: 9,
    position: 2,
    reminders: [{ title: "Follow up if there is no reply", days: -3 }],
  },
  {
    id: "seed-airbnb",
    company: "Airbnb",
    role: "Senior Web Engineer",
    location: "Remote",
    url: "https://careers.airbnb.com",
    salary: "",
    stage: "REJECTED",
    source: "LinkedIn",
    appliedMonthsAgo: 4,
    appliedDay: 15,
    position: 0,
    notes: ["Rejected after the phone screen. Feedback: they wanted more backend depth."],
  },
  {
    id: "seed-datadog",
    company: "Datadog",
    role: "Frontend Engineer",
    location: "New York",
    url: "https://careers.datadoghq.com",
    salary: "$170k–$200k",
    stage: "REJECTED",
    source: "Recruiter",
    appliedMonthsAgo: 3,
    appliedDay: 11,
    position: 1,
    notes: ["Role was reposted with a stronger data-viz focus. Worth a look later."],
  },
  {
    id: "seed-anthropic",
    company: "Anthropic",
    role: "Frontend Engineer",
    location: "San Francisco",
    url: "https://www.anthropic.com/careers",
    salary: "",
    stage: "SAVED",
    source: "Company site",
    position: 0,
    notes: ["Read the research engineering blog before applying."],
  },
  {
    id: "seed-cloudflare",
    company: "Cloudflare",
    role: "Systems UI Engineer",
    location: "Austin",
    url: "https://www.cloudflare.com/careers",
    salary: "",
    stage: "SAVED",
    source: "LinkedIn",
    position: 1,
  },
  {
    id: "seed-mercury",
    company: "Mercury",
    role: "Web Engineer",
    location: "Remote",
    url: "https://mercury.com/jobs",
    salary: "$160k–$190k",
    stage: "SAVED",
    source: "Referral",
    position: 2,
  },
];

export function seedApplications(now = new Date()): Application[] {
  const createdBase = now.getTime() - 1000 * 60 * 60 * 24 * 40;
  return DRAFTS.map((draft, index) => {
    const createdAt = new Date(createdBase + index * 86_400_000).toISOString();
    const appliedAt =
      draft.appliedMonthsAgo === undefined ? "" : monthsAgo(draft.appliedMonthsAgo, draft.appliedDay ?? 1, now);
    const notes: Note[] = (draft.notes ?? []).map((body, noteIndex) => ({
      id: `${draft.id}-note-${noteIndex + 1}`,
      applicationId: draft.id,
      body,
      createdAt,
    }));
    const reminders: Reminder[] = (draft.reminders ?? []).map((reminder, reminderIndex) => ({
      id: `${draft.id}-reminder-${reminderIndex + 1}`,
      applicationId: draft.id,
      title: reminder.title,
      dueAt: daysFromNow(reminder.days, now),
      done: false,
    }));
    return {
      id: draft.id,
      company: draft.company,
      role: draft.role,
      location: draft.location,
      url: draft.url,
      salary: draft.salary,
      stage: draft.stage,
      source: draft.source,
      appliedAt,
      position: draft.position,
      createdAt,
      updatedAt: createdAt,
      notes,
      reminders,
    };
  });
}
