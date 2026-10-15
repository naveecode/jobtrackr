# Jobtrackr

A private pipeline for a job search: applications, notes, reminders, and the rate at which companies actually write back.

**Live demo (no login):** [naveecode.github.io/jobtrackr](https://naveecode.github.io/jobtrackr/)

The demo is a static export. Sample applications are seeded into `localStorage` in the browser. The authenticated app (GitHub OAuth and email magic links, Prisma, server actions) runs as a normal Next.js server.

![Jobtrackr board](docs/screenshots/board.png)

## What it does

- Create, edit, and delete applications.
- Drag cards across a kanban board with [dnd-kit](https://dndkit.com): Saved, Applied, Interview, Offer, Rejected.
- Keep notes and reminders on each role. Overdue follow-ups surface in the header.
- Import and export CSV, including notes. Exports neutralize cells that spreadsheets would treat as formulas.
- Charts, via Recharts: current pipeline, and response rate by the month you applied.

![Application detail](docs/screenshots/detail.png)

![Funnel and response rate](docs/screenshots/analytics.png)

### How the funnel is counted

Saved roles are not submissions. A submission is anything in Applied, Interview, Offer, or Rejected. A response is Interview, Offer, or Rejected. Applied is still waiting.

**Response rate** is responses ÷ submissions. It is blank until something has been submitted. Interview rate counts only roles currently in Interview or Offer, because a rejection does not say whether there was an interview. The monthly chart uses `appliedAt` and skips submissions that have no date.

The seeded demo is 12 roles, 9 submissions, 6 responses: **67%**.

## Stack

Next.js 14 App Router, TypeScript, Tailwind, shadcn/ui (Radix primitives), Prisma, Zod, Auth.js, dnd-kit, Recharts. Vitest for validation and funnel maths. Playwright for the demo flow. GitHub Actions for typecheck, lint, build, tests, and GitHub Pages.

## Data model

```mermaid
erDiagram
  User ||--o{ Account : has
  User ||--o{ Session : has
  User ||--o{ Application : owns
  Application ||--o{ Note : has
  Application ||--o{ Reminder : has

  User {
    string id PK
    string email UK
    string name
  }
  Account {
    string id PK
    string userId FK
    string provider
    string providerAccountId
  }
  Session {
    string id PK
    string sessionToken UK
    string userId FK
  }
  VerificationToken {
    string identifier
    string token
  }
  Application {
    string id PK
    string userId FK
    string company
    string role
    string stage
    int position
    datetime appliedAt
  }
  Note {
    string id PK
    string applicationId FK
    string body
  }
  Reminder {
    string id PK
    string applicationId FK
    string title
    datetime dueAt
    boolean done
  }
```

`User`, `Account`, `Session`, and `VerificationToken` are the Auth.js Prisma adapter models. Magic links need the verification token table. Sessions are database sessions, so `session.user.id` is the Prisma user id.

SQLite is the default provider (local dev and CI). Production Postgres is the same schema: `npm run db:generate` copies `prisma/schema.prisma` and sets `provider = "postgresql"` when `DATABASE_URL` starts with `postgres` or `PRISMA_PROVIDER=postgresql`.

## Auth and per-user isolation

![Sign in](docs/screenshots/sign-in.png)

Two providers, both Auth.js:

- **GitHub OAuth**, when `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` are set. Callback: `{origin}/api/auth/callback/github`.
- **Email magic link** via the Nodemailer provider. Set `EMAIL_SERVER` (for example `smtp://user:pass@smtp.example.com:587`) and `EMAIL_FROM`. With no SMTP server, the link is printed in the server log so local sign-in still works.

There is no shared board. The repository in `src/lib/repository.ts` is the only place that reads or writes applications, notes, and reminders. Each function takes the session user id and queries with it:

- `where: { userId }` or `where: { id, userId }` for applications
- `where: { id, application: { userId } }` for notes and reminders
- updates and deletes use `updateMany` / `deleteMany` with those predicates, so a guessed id from another account changes zero rows and returns "Not found"

Zod parses every write. The client cannot set `userId`. A Vitest test creates two users in SQLite and checks that user B cannot read, update, annotate, or delete user A's application.

Demo mode does not use this path. It never opens a database and it has no session.

## Demo mode and GitHub Pages

`NEXT_PUBLIC_DEMO=1` renders the tracker on `/` and skips sign-in. Data lives in `localStorage` under `jobtrackr.demo.v1`. Reset restores the seed.

`npm run build:demo` sets that flag plus `DEMO_EXPORT=1`, which turns on `output: 'export'`, `basePath: '/jobtrackr'`, and a page extension list that leaves out Auth.js routes and server actions. Those files use a `.server.ts` / `.server.tsx` suffix and are only compiled into the Node server build. GitHub Pages cannot run them.

The [pages workflow](.github/workflows/pages.yml) publishes `out/` on every push to `main`. Pages has to be enabled once by a repository admin (Settings → Pages → Source: GitHub Actions) before the first deploy can succeed. `GITHUB_TOKEN` can deploy a site, and it cannot create one. The site is [naveecode.github.io/jobtrackr](https://naveecode.github.io/jobtrackr/).

## Local development

```bash
cp .env.example .env
# AUTH_SECRET=$(openssl rand -base64 32)
npm install
npm run db:setup   # generate client and push the schema
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the marketing page and sign-in. The board is at `/board`.

Try the demo without configuring OAuth:

```bash
NEXT_PUBLIC_DEMO=1 npm run dev
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | `file:./dev.db` for SQLite, or a `postgresql://` URL |
| `PRISMA_PROVIDER` | `sqlite` or `postgresql`. Inferred from `DATABASE_URL` when omitted |
| `AUTH_SECRET` | Auth.js session secret |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth. Omit both to hide the GitHub button |
| `EMAIL_SERVER` / `EMAIL_FROM` | SMTP for magic links. Omit `EMAIL_SERVER` to log the link |
| `NEXT_PUBLIC_DEMO` | `1` for the localStorage demo |
| `DEMO_EXPORT` | `1` with the demo flag to static-export for GitHub Pages |

## Tests and CI

```bash
npm run typecheck
npm run lint
npm test          # Vitest: Zod validation, funnel maths, CSV, kanban moves, isolation
npm run test:e2e  # Playwright: seeded board, create/note/reminder/move/delete, drag, CSV, reset
npm run build
npm run build:demo
```

CI runs all of the above on push and pull request. Playwright drives the demo dev server, so it does not need GitHub or SMTP credentials.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server. Generates the Prisma client first |
| `npm run db:setup` | Generate the client and push the schema |
| `npm run build` | Production server build (auth, Prisma, server actions) |
| `npm run build:demo` | Static demo in `out/` for GitHub Pages |
| `npm test` | Vitest |
| `npm run test:e2e` | Playwright |
