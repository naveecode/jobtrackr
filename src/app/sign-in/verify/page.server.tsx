import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function VerifyPage() {
  const logsMagicLink = !process.env.EMAIL_SERVER;
  return (
    <div className="mx-auto grid min-h-screen max-w-lg place-items-center px-6">
      <div className="w-full rounded-2xl border bg-card p-8 shadow-card">
        <Wordmark />
        <h1 className="mt-6 font-display text-4xl">Check your email.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A sign-in link is on its way. It expires in 24 hours and only works once.
        </p>
        {logsMagicLink ? (
          <p className="mt-3 text-sm text-muted-foreground">
            SMTP is not configured, so the link was printed in the server log instead of being delivered.
          </p>
        ) : null}
        <Link href="/sign-in" className="mt-6 inline-block text-sm text-copper underline-offset-4 hover:underline">
          Use a different email
        </Link>
      </div>
    </div>
  );
}
