import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function formatCurrency(amount: number) {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
]

// Computes the weekday from a "YYYY-MM-DD" string using UTC arithmetic so the
// result doesn't shift depending on the server's or browser's local timezone.
export function dayOfWeek(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  return WEEKDAYS[new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()]
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}
