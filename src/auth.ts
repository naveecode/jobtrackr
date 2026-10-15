import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Nodemailer from "next-auth/providers/nodemailer";
import nodemailer from "nodemailer";
import { getPrisma } from "@/lib/prisma";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const providers = [];

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  );
}

providers.push(
  Nodemailer({
    server: process.env.EMAIL_SERVER || { jsonTransport: true },
    from: process.env.EMAIL_FROM || "Jobtrackr <noreply@jobtrackr.local>",
    async sendVerificationRequest({ identifier, url }) {
      const from = process.env.EMAIL_FROM || "Jobtrackr <noreply@jobtrackr.local>";
      if (!process.env.EMAIL_SERVER) {
        console.info(`\n[jobtrackr] Magic link for ${identifier}\n${url}\n`);
        return;
      }
      const transport = nodemailer.createTransport(process.env.EMAIL_SERVER);
      await transport.sendMail({
        to: identifier,
        from,
        subject: "Your Jobtrackr sign-in link",
        text: `Sign in to Jobtrackr:\n\n${url}\n\nThis link expires in 24 hours. If you did not request it, you can ignore this email.`,
        html: `<p>Sign in to Jobtrackr.</p><p><a href="${escapeHtml(url)}">Open Jobtrackr</a></p><p>This link expires in 24 hours. If you did not request it, you can ignore this email.</p>`,
      });
    },
  }),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(getPrisma()),
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "database" },
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/sign-in/verify",
  },
  providers,
  callbacks: {
    session({ session, user }) {
      if (user?.id) session.user.id = user.id;
      return session;
    },
  },
});
