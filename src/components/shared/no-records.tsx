import Link from "next/link";
import { CalendarDays, FileText, Inbox, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const ICONS: Record<string, LucideIcon> = {
  calendar: CalendarDays,
  users: Users,
  file: FileText,
  inbox: Inbox,
};

export type NoRecordsAction = { label: string } & (
  | { onClick: () => void; href?: never }
  | { href: string; onClick?: never }
);

export interface NoRecordsProps {
  title: string;
  description: string;
  icon?: "calendar" | "users" | "file" | "inbox";
  action?: NoRecordsAction;
}

// Server components (most of our pages) can't pass onClick handlers across
// the RSC boundary, so `action` also accepts a plain `href` for pure
// navigation — only client components need the onClick form.
export function NoRecords({ title, description, icon = "inbox", action }: NoRecordsProps) {
  const Icon = ICONS[icon]!;

  return (
    <div className="flex flex-col items-center py-16">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--navy-lt)]">
        <Icon className="h-9 w-9 text-[var(--navy)] opacity-40" />
      </div>
      <p className="mb-2 text-base font-semibold text-[var(--text-1)]">{title}</p>
      <p className="max-w-xs text-center text-sm text-[var(--text-2)]">{description}</p>
      {action &&
        (action.href ? (
          <Button variant="outline" className="mt-4" asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button variant="outline" className="mt-4" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  );
}
