import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

const points = [
  {
    title: "A board that matches the search",
    body: "Saved, applied, interview, offer, rejected. Drag a card when the status changes. Notes and reminders stay on the role.",
  },
  {
    title: "Your rows, and nobody else's",
    body: "GitHub or a magic link signs you in. Every query is scoped to that user id, including notes, reminders, and CSV import.",
  },
  {
    title: "A funnel you can defend",
    body: "Response rate is replies divided by submissions. Saved roles do not count. The monthly chart shows whether follow-ups are working.",
  },
];

export function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Wordmark />
        <Link href="/sign-in" className="rounded-md bg-ink px-4 py-2 text-sm text-paper">
          Sign in
        </Link>
      </header>
      <main className="mx-auto grid max-w-5xl gap-12 px-6 pb-20 pt-10">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.18em] text-copper">Private job search</p>
          <h1 className="mt-3 font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">The search, kept in order.</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Jobtrackr is a pipeline for applications, follow-ups, and the rate at which companies actually write back.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/sign-in" className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
              Continue with email or GitHub
            </Link>
            <a href="https://naveecode.github.io/jobtrackr/" className="rounded-md border bg-card px-4 py-2.5 text-sm">
              Open the live demo
            </a>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {points.map((point) => (
            <article key={point.title} className="rounded-2xl border bg-card p-5 shadow-card">
              <h2 className="font-display text-2xl leading-tight">{point.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
