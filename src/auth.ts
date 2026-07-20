import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";
import { authConfig } from "@/auth.config";
import { adminDb } from "@/lib/firebase-admin";
import type { UserRole } from "@/types/next-auth";

async function findUserByEmail(email: string) {
  const snap = await adminDb.collection("users").where("email", "==", email).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return { id: doc.id, ...doc.data() } as {
    id: string;
    role: UserRole;
    managerId?: string | null;
    active?: boolean;
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (!user.email) return false;
      const dbUser = await findUserByEmail(user.email);
      // Unknown emails never get a session — Firestore is the allowlist.
      if (!dbUser) return false;
      // Archived (soft-deleted) apprentices are blocked at login, not just
      // hidden in the UI — send them straight to the deactivated-account page
      // instead of the generic error NextAuth would otherwise show.
      if (dbUser.active === false) return "/unauthorized?reason=archived";
      return true;
    },
    async jwt({ token, trigger }: { token: JWT; trigger?: string }) {
      // Only hit Firestore on the initial sign-in; afterwards the role
      // already lives in the encrypted JWT, so refreshes stay free.
      if (token.email && (trigger === "signIn" || token.role === undefined)) {
        const user = await findUserByEmail(token.email);
        token.uid = user?.id;
        token.role = user?.role;
        token.managerId = user?.managerId ?? null;
        token.active = user?.active ?? true;
      }
      return token;
    },
  },
});
