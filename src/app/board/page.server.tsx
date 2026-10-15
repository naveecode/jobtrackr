import { redirect } from "next/navigation";
import { AuthedTracker } from "@/components/authed-tracker";
import { auth } from "@/auth";
import { listApplications } from "@/lib/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BoardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const applications = await listApplications(session.user.id);
  return (
    <AuthedTracker
      initial={applications}
      user={{ name: session.user.name, email: session.user.email }}
    />
  );
}
