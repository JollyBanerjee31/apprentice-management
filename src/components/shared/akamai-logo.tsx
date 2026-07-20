import Image from "next/image";

interface AkamaiLogoProps {
  variant?: "default" | "muted";
  width?: number;
  className?: string;
  priority?: boolean;
}

// public/akamai-logo.svg is already full-colour (orange wordmark + blue mark)
// and reads correctly on both white and navy backgrounds, so no invert filter
// is needed the way the old single-tone /akamai.svg required.
export function AkamaiLogo({ variant = "default", width = 100, className, priority }: AkamaiLogoProps) {
  const filterClass = variant === "muted" ? "opacity-40" : "";
  const height = Math.round((width * 209) / 512);

  return (
    <Image
      src="/akamai-logo.svg"
      alt="Akamai"
      width={width}
      height={height}
      priority={priority}
      className={`${filterClass} ${className ?? ""}`}
    />
  );
}
