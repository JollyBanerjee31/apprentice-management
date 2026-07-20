"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex w-full items-center gap-[10px] rounded-[7px] px-3 py-2 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[var(--danger-lt)] hover:text-[var(--danger)]"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
