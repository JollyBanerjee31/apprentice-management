import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/types/next-auth";

/**
 * Edge-safe config: no firebase-admin import here.
 * middleware.ts runs on the Edge runtime, which can't load firebase-admin
 * (it needs Node APIs), so this file must stay free of that dependency.
 * The full config with the Google provider and Firestore lookups lives in
 * auth.ts and only runs in Node (API routes / server components).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    session({ session, token }) {
      session.user.id = (token.uid as string) ?? "";
      session.user.role = token.role as UserRole | undefined;
      session.user.managerId = (token.managerId as string | null) ?? null;
      session.user.active = token.active as boolean | undefined;
      return session;
    },
  },
} satisfies NextAuthConfig;
