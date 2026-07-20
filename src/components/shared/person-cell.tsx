import { initials } from "@/lib/utils";

interface PersonCellProps {
  name: string;
  role: string;
  tone?: "orange" | "navy";
}

const TONE_CLASS: Record<NonNullable<PersonCellProps["tone"]>, string> = {
  orange: "bg-[var(--orange)] text-white",
  navy: "bg-[var(--navy-lt)] text-[var(--navy)]",
};

export function PersonCell({ name, role, tone = "orange" }: PersonCellProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${TONE_CLASS[tone]}`}
      >
        {initials(name)}
      </div>
      <div>
        <p className="font-semibold text-[var(--text-1)]">{name}</p>
        <p className="text-xs text-[var(--text-3)]">{role}</p>
      </div>
    </div>
  );
}
