import Link from "next/link";
import { redirect } from "next/navigation";
import { signInWithEmail, signInWithGitHub } from "@/actions/auth";
import { Wordmark } from "@/components/wordmark";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ERRORS: Record<string, string> = {
  OAuthSignin: "Could not start GitHub sign-in. Check the OAuth app credentials.",
  OAuthCallback: "GitHub returned without a valid session.",
  OAuthAccountNotLinked: "That email is already used with a different sign-in method.",
  EmailSignin: "Could not send the magic link. Check the address and SMTP settings.",
  InvalidEmail: "Enter a valid email address.",
  Configuration: "Auth is missing a configuration value.",
  AccessDenied: "Access was denied.",
  Verification: "That magic link is invalid or has expired.",
  Default: "Something went wrong signing in. Try again.",
};

export default async function SignInPage({ searchParams }: { searchParams?: { error?: string } }) {
  const session = await auth();
  if (session?.user?.id) redirect("/board");
  const githubEnabled = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
  const logsMagicLink = !process.env.EMAIL_SERVER;
  const error = searchParams?.error ? ERRORS[searchParams.error] ?? ERRORS.Default : null;

  return (
    <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-6 py-12 md:grid-cols-2">
      <div>
        <Link href="/" className="inline-flex">
          <Wordmark />
        </Link>
        <h1 className="mt-8 font-display text-5xl leading-[1.05] tracking-tight">Sign in to your pipeline.</h1>
        <p className="mt-4 text-muted-foreground">
          GitHub for a one-click account, or an email magic link if you would rather not connect a social login. Sessions are stored in the database and every application is keyed to that user.
        </p>
      </div>
      <div className="rounded-2xl border bg-card p-6 shadow-card">
        {error ? (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {githubEnabled ? (
          <form action={signInWithGitHub}>
            <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ink text-sm text-paper">
              <GitHubMark />
              Continue with GitHub
            </button>
          </form>
        ) : (
          <p className="rounded-md bg-secondary px-3 py-2 text-sm text-muted-foreground">
            GitHub sign-in is off until <code>AUTH_GITHUB_ID</code> and <code>AUTH_GITHUB_SECRET</code> are set.
          </p>
        )}
        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or email a link
          <span className="h-px flex-1 bg-border" />
        </div>
        <form action={signInWithEmail} className="grid gap-3">
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="email">
            Email
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="h-10 rounded-md border border-input bg-card px-3 text-sm font-normal"
            />
          </label>
          <button type="submit" className="h-11 rounded-md bg-primary text-sm font-medium text-primary-foreground">
            Email me a link
          </button>
        </form>
        {logsMagicLink ? (
          <p className="mt-4 text-xs text-muted-foreground">
            No SMTP server is configured, so the magic link is printed in the server log. Set <code>EMAIL_SERVER</code> to send it for real.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
