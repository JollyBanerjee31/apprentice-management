"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
}

interface SidebarNavProps {
  items: NavItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col overflow-y-auto p-2">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={`mt-1 flex items-center gap-[10px] rounded-[10px] px-2.5 py-[8px] text-[13.5px] font-medium transition-all duration-150 ${
              isActive
                ? "bg-white/10 font-semibold text-[var(--orange)]"
                : "text-white/65 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            {isActive ? (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-[var(--orange)] text-white">
                {item.icon}
              </span>
            ) : (
              item.icon
            )}
            {item.label}
            {item.badge !== undefined && (
              <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--orange)] text-[10px] font-bold text-white">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
