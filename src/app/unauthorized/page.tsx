import Link from "next/link";
import { UserX } from "lucide-react";

export default function UnauthorizedPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  if (searchParams.reason === "archived") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--danger-lt)]">
          <UserX className="h-8 w-8 text-[var(--danger)]" />
        </div>
        <h1 className="text-xl font-bold text-[var(--text-1)]">Account Deactivated</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your account has been deactivated by HR. Please contact your HR team if you believe
          this is a mistake.
        </p>
        <a
          href="#"
          className="rounded-md bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Contact HR Support
        </a>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <h1 className="text-xl font-bold text-brand-navy">Access restricted</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your Google account isn&apos;t registered in the Leave Management System, or your role
        couldn&apos;t be determined. Contact HR if you believe this is a mistake.
      </p>
      <Link href="/login" className="text-sm font-medium text-brand-navy underline">
        Back to sign in
      </Link>
    </main>
  );
}
