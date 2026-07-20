"use client";

import { signIn } from "next-auth/react";
import { CalendarDays, Clock, Lock, User, Users } from "lucide-react";
import { AkamaiLogo } from "@/components/shared/akamai-logo";

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.4-1.04 2.58-2.21 3.37v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.15z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Easy Leave Requests",
    subtitle: "Request leaves in a few clicks.",
  },
  {
    icon: Clock,
    title: "Real-time Tracking",
    subtitle: "Stay updated on your leave status.",
  },
  {
    icon: Users,
    title: "Manager & HR Sync",
    subtitle: "Approvals, visibility and insights all in one place.",
  },
];

export default function LoginPage() {
  return (
    <main className="flex min-h-screen">
      {/* LEFT — brand panel (hidden below lg: the reference is a fixed
          47/53 desktop split with no documented mobile behavior) */}
      <div
        className="relative hidden w-[47%] flex-col bg-cover bg-center p-12 lg:flex"
        style={{ backgroundImage: "url(/login-background.png)" }}
      >
        <AkamaiLogo width={120} priority />

        <div className="relative flex flex-1 flex-col justify-center">
          <h1 className="text-[48px] font-bold leading-[1.1] text-white">Simplify Leaves.</h1>
          <h1 className="text-[48px] font-bold leading-[1.1] text-[var(--orange)]">Empower People.</h1>
          <p className="mt-4 max-w-sm text-base text-white/70">
            The unified leave management experience for Akamai employees. Faster. Clearer. Built for
            you.
          </p>

          <div className="mt-10 flex flex-col gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-sm">
                  <f.icon className="h-[18px] w-[18px] text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-[13px] text-white/60">{f.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — login panel */}
      <div className="flex w-full flex-col items-center justify-center bg-white p-12 lg:w-[53%]">
        <div className="flex w-full max-w-[380px] flex-1 flex-col items-center justify-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl border-2 border-[var(--orange)]">
            <User className="h-7 w-7 text-[var(--orange)]" />
          </div>

          <h2 className="mb-2 text-[28px] font-bold text-[#0a0a1a]">Welcome back</h2>
          <p className="mb-8 text-[15px] text-[#4a5068]">Sign in to continue to Akamai Leave Hub</p>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="flex h-[52px] w-full items-center gap-4 rounded-[10px] border-[1.5px] border-[#e2e8f0] bg-white px-5 shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-all duration-150 hover:-translate-y-px hover:border-[#cbd5e1] hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
          >
            <GoogleIcon />
            <span className="text-[15px] font-semibold text-[#0a0a1a]">Sign in with Google</span>
          </button>

          <div className="mt-5 flex items-center justify-center gap-2">
            <Lock className="h-[14px] w-[14px] text-[#9299b0]" />
            <span className="text-[13px] text-[#9299b0]">Secure authentication via Google SSO</span>
          </div>
        </div>

        <div className="mt-auto w-full max-w-xl">
          <div className="mb-5 h-px bg-[#e2e8f0]" />
          <div className="flex flex-nowrap items-center justify-center gap-4 whitespace-nowrap text-[13px] text-[#9299b0]">
            <span>
              Need help? Contact{" "}
              <a href="#" className="text-[var(--orange)] hover:underline">
                HR Service Desk
              </a>
            </span>
            <span className="text-[#e2e8f0]">|</span>
            <a href="#" className="hover:text-[var(--orange)]">
              Privacy Policy
            </a>
            <span className="text-[#e2e8f0]">|</span>
            <a href="#" className="hover:text-[var(--orange)]">
              Terms of Use
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
