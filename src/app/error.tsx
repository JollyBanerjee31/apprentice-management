"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";
import { AkamaiLogo } from "@/components/shared/akamai-logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col bg-[var(--navy)]">
      <header className="grid h-16 shrink-0 grid-cols-3 items-center border-b border-white/10 px-7">
        <a href="/" aria-label="Go to dashboard">
          <AkamaiLogo width={110} priority />
        </a>
        <p className="justify-self-center text-base font-semibold text-white">
          Apprentice Leave Management
        </p>
      </header>

      <div
        className="relative flex flex-1 items-center bg-cover bg-right px-7 py-16 lg:px-16"
        style={{ backgroundImage: "url(/error.png)" }}
      >
        <div className="max-w-lg">
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--orange)]">
            Error
          </p>

          <h1 className="mt-3 text-3xl font-bold text-white">
            <span className="text-[var(--orange)]">Oops!</span> Something went wrong.
          </h1>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/60">
            An unexpected error occurred while loading this page. You can try again, or head
            back to your dashboard.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--orange)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--orange-dk)]"
            >
              <RotateCw className="h-4 w-4" />
              Try again
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--orange)] px-5 py-3 text-sm font-semibold text-[var(--orange)] transition-colors hover:bg-[var(--orange)] hover:text-white"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
