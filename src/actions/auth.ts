"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { emailSchema } from "@/lib/validation";

export async function signInWithGitHub() {
  try {
    await signIn("github", { redirectTo: "/board" });
  } catch (error) {
    if (error instanceof AuthError) redirect(`/sign-in?error=${error.type}`);
    throw error;
  }
}

export async function signInWithEmail(formData: FormData) {
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? ""));
  if (!parsed.success) redirect("/sign-in?error=InvalidEmail");
  try {
    await signIn("nodemailer", { email: parsed.data, redirectTo: "/board" });
  } catch (error) {
    if (error instanceof AuthError) redirect(`/sign-in?error=${error.type}`);
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
