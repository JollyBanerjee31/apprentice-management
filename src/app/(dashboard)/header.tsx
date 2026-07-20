"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Bell, BellOff, ChevronDown, LogOut, Settings, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useReadNotifications } from "@/hooks/use-read-notifications";
import { initials } from "@/lib/utils";
import type { NotificationItem, Role } from "@/types/index";

const ROLE_TAG_CLASS: Record<Role, string> = {
  apprentice: "bg-[var(--orange-lt)] text-[var(--orange-dk)]",
  manager: "bg-[var(--navy-lt)] text-[var(--navy)]",
  hr: "bg-[var(--success-lt)] text-[var(--success)]",
  // Unreachable in practice — middleware redirects "none"-role sessions to
  // /unauthorized before this header ever renders. Present only so the
  // Record<Role, ...> stays exhaustive.
  none: "bg-[var(--surface)] text-[var(--text-3)]",
};

const ROLE_DISPLAY: Record<Role, string> = {
  apprentice: "Apprentice",
  manager: "Manager",
  hr: "HR Admin",
  none: "No Access",
};

interface HeaderProps {
  name: string;
  email: string;
  role: Role;
  notifications: NotificationItem[];
}

export function Header({ name, email, role, notifications }: HeaderProps) {
  const userInitials = initials(name);
  const { readIds, markRead, markAllRead } = useReadNotifications(email);
  const unread = notifications.filter((n) => !readIds.has(n.id));
  const alertCount = unread.length;
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="fixed left-[240px] right-0 top-0 z-40 flex h-16 items-center border-b border-[var(--border)] bg-white px-7 shadow-[0_1px_4px_rgba(0,20,108,0.06)]">
      <div className="flex-1">
        <p className="text-xl font-bold text-[var(--text-1)]">Apprentice Leave Management</p>
        <p className="text-xs text-[var(--text-3)]">
          Internal {ROLE_DISPLAY[role]} Portal · Akamai Technologies
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Notifications"
              className="relative rounded-full p-2 text-[var(--text-2)] outline-none transition-colors hover:bg-[var(--surface)] focus-visible:outline-none"
            >
              <Bell className="h-5 w-5" />
              {alertCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-[var(--orange)] px-[4px] text-[10px] font-bold leading-none text-white">
                  {alertCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="center" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-1)]">Notifications</p>
              {unread.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    markAllRead(notifications.map((n) => n.id))
                  }
                  className="text-xs font-medium text-[var(--orange)] outline-none hover:underline focus-visible:outline-none"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {unread.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <BellOff className="h-6 w-6 text-[var(--text-3)]" />
                <p className="text-sm font-medium text-[var(--text-1)]">You&apos;re all caught up</p>
                <p className="text-xs text-[var(--text-3)]">No new notifications right now.</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {unread.map((n) => (
                  <div
                    key={n.id}
                    className="group relative flex items-start gap-2 px-4 py-[9px] transition-colors hover:bg-[var(--surface)]"
                  >
                    <Link
                      href={n.href}
                      onClick={() => {
                        markRead(n.id);
                        setNotifOpen(false);
                      }}
                      className="min-w-0 flex-1 whitespace-normal outline-none"
                    >
                      <p className="pr-5 text-[13px] font-medium text-[var(--text-1)]">{n.message}</p>
                      <p className="text-xs text-[var(--text-3)]">{n.meta}</p>
                    </Link>
                    <button
                      type="button"
                      aria-label="Clear notification"
                      onClick={() => markRead(n.id)}
                      className="absolute right-2 top-2 shrink-0 rounded-full p-1 text-[var(--text-3)] opacity-0 outline-none transition-opacity hover:bg-white hover:text-[var(--text-1)] focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-[10px] outline-none focus-visible:outline-none"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--orange)] text-[13px] font-bold text-white">
                {userInitials}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold leading-tight text-[var(--text-1)]">{name}</p>
                <p className="text-[11px] leading-tight text-[var(--text-3)]">{ROLE_DISPLAY[role]}</p>
              </div>
              <ChevronDown className="h-[14px] w-[14px] text-[var(--text-3)]" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60 p-0">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--orange)] text-sm font-semibold text-white">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text-1)]">{name}</p>
                  <p className="truncate text-xs text-[var(--text-3)]">{email}</p>
                </div>
              </div>
              <span
                className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ROLE_TAG_CLASS[role]}`}
              >
                {role}
              </span>
            </div>

            <DropdownMenuSeparator />

            {role === "hr" && (
              <DropdownMenuItem asChild>
                <Link href="/hr/config">
                  <Settings className="h-[15px] w-[15px]" />
                  Settings
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-[var(--text-2)] hover:bg-[var(--danger-lt)] hover:text-[var(--danger)] focus:bg-[var(--danger-lt)] focus:text-[var(--danger)]"
            >
              <LogOut className="h-[15px] w-[15px]" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
