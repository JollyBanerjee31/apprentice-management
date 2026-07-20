import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AkamaiLogo } from "@/components/shared/akamai-logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--navy)]">
      <header className="grid h-16 shrink-0 grid-cols-3 items-center border-b border-white/10 px-7">
        <Link href="/" aria-label="Go to dashboard">
          <AkamaiLogo width={110} priority />
        </Link>
        <p className="justify-self-center text-base font-semibold text-white">
          Apprentice Leave Management
        </p>
      </header>

      <div
        className="relative flex flex-1 items-center bg-cover bg-right px-7 py-16 lg:px-16"
        style={{ backgroundImage: "url(/not-found.png)" }}
      >
        <div className="max-w-lg">
          <p className="text-[110px] font-extrabold leading-none tracking-tight text-white">
            4<span className="text-[var(--orange)]">0</span>4
          </p>

          <h1 className="mt-4 text-3xl font-bold text-white">
            <span className="text-[var(--orange)]">Oops!</span> Page not found.
          </h1>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/60">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-lg border border-[var(--orange)] px-5 py-3 text-sm font-semibold text-[var(--orange)] transition-colors hover:bg-[var(--orange)] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
