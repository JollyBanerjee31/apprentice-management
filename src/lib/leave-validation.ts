import "server-only";
import { differenceInCalendarDays, format } from "date-fns";
import {
  getApprovedLeaveForMonth,
  getHolidaysInRange,
  getPendingLeaveForMonth,
  getTotalUsedLeave,
  isHoliday,
} from "@/lib/firestore";
import { formatDate } from "@/lib/utils";
import type { AppUser } from "@/types/index";

export interface LeaveValidationError {
  code: string;
  message: string;
  holidayName?: string;
  extraLeaveUrl?: string;
}

export type LeaveValidationResult =
  | { ok: true; noOfDays: number }
  | { ok: false; error: LeaveValidationError };

function calendarMonthYear(dateStr: string) {
  const [year, month] = dateStr.split("-").map(Number);
  return { month: month!, year: year! };
}

// Shared by app/api/leave/submit/route.ts and scripts/test-flows.ts so the
// script exercises the exact same rules the app enforces, not a re-implementation.
export async function validateLeaveSubmission(
  user: AppUser,
  startDate: string,
  endDate: string,
): Promise<LeaveValidationResult> {
  const noOfDays = differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1;

  // 1. Only 1 day of leave allowed per calendar month.
  if (noOfDays > 1) {
    return {
      ok: false,
      error: { code: "EXCEEDS_LIMIT", message: "Only 1 day of leave is allowed per calendar month" },
    };
  }

  // 2. Can't request leave before the apprenticeship started.
  if (startDate < user.hireDate) {
    return {
      ok: false,
      error: { code: "BEFORE_HIRE_DATE", message: "You can't request leave before your hire date" },
    };
  }

  // 3. Can't backdate a request into a month that's already over.
  const { month, year } = calendarMonthYear(startDate);
  const now = new Date();
  const currentMonthKey = now.getFullYear() * 12 + now.getMonth();
  const requestedMonthKey = year * 12 + (month - 1);
  if (requestedMonthKey < currentMonthKey) {
    return {
      ok: false,
      error: { code: "BACKDATED", message: "You can't request leave for a past month" },
    };
  }

  // 4. The date is already a public holiday — no leave day needed.
  const holiday = await isHoliday(startDate);
  if (holiday) {
    return {
      ok: false,
      error: {
        code: "HOLIDAY",
        holidayName: holiday.name,
        message: `${formatDate(startDate)} is already a public holiday (${holiday.name})`,
      },
    };
  }

  // 5. Already have approved leave this month.
  const approvedThisMonth = await getApprovedLeaveForMonth(user.id, month, year);
  if (approvedThisMonth.length > 0) {
    return {
      ok: false,
      error: {
        code: "APPROVED_EXISTS",
        message: "You've already used your leave for this month",
        extraLeaveUrl: "/apprentice/apply/extra",
      },
    };
  }

  // 6. Already have a pending request this month.
  const pendingThisMonth = await getPendingLeaveForMonth(user.id, month, year);
  if (pendingThisMonth.length > 0) {
    return {
      ok: false,
      error: {
        code: "PENDING_EXISTS",
        message: "You already have a pending leave request for this month",
      },
    };
  }

  // 7. Annual leave balance is exhausted.
  const usedLeave = await getTotalUsedLeave(user.id);
  if (usedLeave >= user.totalLeave) {
    return {
      ok: false,
      error: {
        code: "NO_BALANCE",
        message: "You've used your full leave balance",
        extraLeaveUrl: "/apprentice/apply/extra",
      },
    };
  }

  return { ok: true, noOfDays };
}

export type ExtraLeaveValidationResult =
  | { ok: true; noOfDays: number }
  | { ok: false; error: string };

export async function validateExtraLeaveSubmission(
  user: AppUser,
  startDate: string,
  endDate: string,
): Promise<ExtraLeaveValidationResult> {
  if (endDate < startDate) {
    return { ok: false, error: "End date can't be before start date" };
  }
  if (startDate < user.hireDate) {
    return { ok: false, error: "You can't request leave before your hire date" };
  }

  const today = format(new Date(), "yyyy-MM-dd");
  if (startDate < today) {
    return { ok: false, error: "You can't backdate a leave request" };
  }

  const holidaysInRange = await getHolidaysInRange(startDate, endDate);
  if (holidaysInRange.length > 0) {
    return {
      ok: false,
      error: `${holidaysInRange[0]!.name} (${holidaysInRange[0]!.date}) falls within this date range and is already a holiday`,
    };
  }

  const noOfDays = differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1;
  return { ok: true, noOfDays };
}
