import Image from "next/image";

const SOCIAL_LINKS = [
  {
    label: "YouTube",
    href: "https://youtube.com/user/akamaitechnologies",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
        <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.88.56 9.38.56 9.38.56s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.4 3.6-6.4 3.6Z" />
      </svg>
    ),
  },
  {
    label: "Twitter (X)",
    href: "https://twitter.com/Akamai",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[15px] w-[15px]">
        <path d="M18.24 2h3.3l-7.2 8.24L23 22h-6.62l-5.18-6.77L5.24 22H1.94l7.7-8.8L1 2h6.79l4.68 6.19L18.24 2Zm-1.16 18h1.83L7.02 3.9H5.06L17.08 20Z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/akamai-technologies",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[17px] w-[17px]">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/AkamaiTechnologies/",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[17px] w-[17px]">
        <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-white">
      <div className="flex flex-col gap-4 px-7 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Image src="/akamai-footer.svg" alt="Akamai" width={88} height={36} className="opacity-70" />
          <div className="hidden h-8 w-px bg-[var(--border)] sm:block" />
          <div>
            <p className="text-xs text-[var(--text-3)]">
              © {new Date().getFullYear()} Akamai Technologies, Inc. · Internal Use Only
            </p>
            <p className="text-[11px] text-[var(--text-3)]">
              Apprentice Leave Management System · v1.0.0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-3)] transition-colors hover:bg-[var(--orange-lt)] hover:text-[var(--orange)]"
              >
                {s.icon}
              </a>
            ))}
          </div>
          <div className="hidden h-8 w-px bg-[var(--border)] sm:block" />
          <a href="#" className="whitespace-nowrap text-[13px] font-semibold text-[var(--orange)] hover:underline">
            Need help? Contact HR Support →
          </a>
        </div>
      </div>
    </footer>
  );
}
