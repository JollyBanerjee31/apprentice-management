import type { DefaultSession } from "next-auth";
import type { Role } from "@/types/index";

export type UserRole = Role;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: UserRole;
      managerId?: string | null;
      active?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: UserRole;
    managerId?: string | null;
    active?: boolean;
  }
}
