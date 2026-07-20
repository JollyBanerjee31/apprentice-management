import "server-only";
import { adminDb } from "@/lib/firebase-admin";
import type {
  AppUser,
  ExtraLeaveRequest,
  Holiday,
  LeaveRequest,
  PayrollRecord,
  StipendSlip,
} from "@/types/index";

const usersCol = adminDb.collection("users");
const leaveRequestsCol = adminDb.collection("leaveRequests");
const extraLeaveRequestsCol = adminDb.collection("extraLeaveRequests");
const holidaysCol = adminDb.collection("holidays");
const payrollCol = adminDb.collection("payroll");
const systemConfigCol = adminDb.collection("systemConfig");
const stipendSlipsCol = adminDb.collection("stipendSlips");

function monthBounds(month: number, year: number) {
  const monthStr = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  return {
    monthStart: `${year}-${monthStr}-01`,
    monthEnd: `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function overlapsMonth(startDate: string, endDate: string, month: number, year: number) {
  const { monthStart, monthEnd } = monthBounds(month, year);
  return startDate <= monthEnd && endDate >= monthStart;
}

// ── USERS ──────────────────────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const snap = await usersCol.where("email", "==", email).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return { id: doc.id, ...doc.data() } as AppUser;
}

export async function getUserByApprenticeId(apprenticeId: string): Promise<AppUser | null> {
  const snap = await usersCol.where("apprenticeId", "==", apprenticeId).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return { id: doc.id, ...doc.data() } as AppUser;
}

export async function getUserById(id: string): Promise<AppUser | null> {
  const doc = await usersCol.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as AppUser;
}

export async function getAllUsers(): Promise<AppUser[]> {
  const snap = await usersCol.get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AppUser);
}

export async function getAllHRUsers(): Promise<AppUser[]> {
  const snap = await usersCol.where("role", "==", "hr").get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AppUser);
}

// Deliberately a single-field query (`role`) filtered in JS, not
// `.where("active", "!=", false)` — Firestore inequality filters exclude
// any document missing the field entirely, which every apprentice created
// before the archive feature shipped would be, silently hiding them all.
export async function getActiveApprentices(): Promise<AppUser[]> {
  const snap = await usersCol.where("role", "==", "apprentice").get();
  return snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as AppUser)
    .filter((u) => u.active !== false);
}

export async function createUser(data: Omit<AppUser, "id">): Promise<string> {
  const ref = await usersCol.add(data);
  return ref.id;
}

export async function updateUser(id: string, data: Partial<AppUser>): Promise<void> {
  await usersCol.doc(id).update(data);
}

// ── LEAVE REQUESTS ─────────────────────────────────────────────────

export async function createLeaveRequest(data: Omit<LeaveRequest, "id">): Promise<string> {
  const ref = await leaveRequestsCol.add(data);
  return ref.id;
}

export async function getLeaveRequestById(id: string): Promise<LeaveRequest | null> {
  const doc = await leaveRequestsCol.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as LeaveRequest;
}

export async function getLeaveRequestsByApprentice(apprenticeId: string): Promise<LeaveRequest[]> {
  const snap = await leaveRequestsCol.where("apprenticeId", "==", apprenticeId).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as LeaveRequest);
}

export async function getLeaveRequestsByManager(managerId: string): Promise<LeaveRequest[]> {
  const snap = await leaveRequestsCol.where("managerId", "==", managerId).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as LeaveRequest);
}

export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
  const snap = await leaveRequestsCol.get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as LeaveRequest);
}

export async function updateLeaveRequest(id: string, data: Partial<LeaveRequest>): Promise<void> {
  await leaveRequestsCol.doc(id).update(data);
}

export async function getApprovedLeaveForMonth(
  apprenticeId: string,
  month: number,
  year: number,
): Promise<LeaveRequest[]> {
  const all = await getLeaveRequestsByApprentice(apprenticeId);
  return all.filter(
    (r) => r.status === "approved" && overlapsMonth(r.startDate, r.endDate, month, year),
  );
}

export async function getPendingLeaveForMonth(
  apprenticeId: string,
  month: number,
  year: number,
): Promise<LeaveRequest[]> {
  const all = await getLeaveRequestsByApprentice(apprenticeId);
  return all.filter(
    (r) => r.status === "pending" && overlapsMonth(r.startDate, r.endDate, month, year),
  );
}

export async function getTotalUsedLeave(apprenticeId: string): Promise<number> {
  const all = await getLeaveRequestsByApprentice(apprenticeId);
  return all
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + r.noOfDays, 0);
}

// ── EXTRA LEAVE (LOP) ──────────────────────────────────────────────

export async function createExtraLeaveRequest(
  data: Omit<ExtraLeaveRequest, "id">,
): Promise<string> {
  const ref = await extraLeaveRequestsCol.add(data);
  return ref.id;
}

export async function getExtraLeaveRequestById(id: string): Promise<ExtraLeaveRequest | null> {
  const doc = await extraLeaveRequestsCol.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as ExtraLeaveRequest;
}

export async function getExtraLeaveRequestsByApprentice(
  apprenticeId: string,
): Promise<ExtraLeaveRequest[]> {
  const snap = await extraLeaveRequestsCol.where("apprenticeId", "==", apprenticeId).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ExtraLeaveRequest);
}

export async function getAllExtraLeaveRequests(): Promise<ExtraLeaveRequest[]> {
  const snap = await extraLeaveRequestsCol.get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ExtraLeaveRequest);
}

export async function updateExtraLeaveRequest(
  id: string,
  data: Partial<ExtraLeaveRequest>,
): Promise<void> {
  await extraLeaveRequestsCol.doc(id).update(data);
}

export async function getTotalLOPForMonth(
  apprenticeId: string,
  month: number,
  year: number,
): Promise<number> {
  const all = await getExtraLeaveRequestsByApprentice(apprenticeId);
  return all
    .filter((r) => r.status === "approved" && overlapsMonth(r.startDate, r.endDate, month, year))
    .reduce((sum, r) => sum + (r.lopDays ?? r.noOfDays), 0);
}

// ── HOLIDAYS ───────────────────────────────────────────────────────

export async function getAllHolidays(): Promise<Holiday[]> {
  const snap = await holidaysCol.orderBy("date").get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Holiday);
}

export async function getHolidaysInRange(startDate: string, endDate: string): Promise<Holiday[]> {
  const snap = await holidaysCol.where("date", ">=", startDate).where("date", "<=", endDate).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Holiday);
}

export async function createHoliday(data: Omit<Holiday, "id">): Promise<string> {
  const ref = await holidaysCol.add(data);
  return ref.id;
}

export async function updateHoliday(id: string, data: Partial<Holiday>): Promise<void> {
  await holidaysCol.doc(id).update(data);
}

export async function deleteHoliday(id: string): Promise<void> {
  await holidaysCol.doc(id).delete();
}

export async function isHoliday(dateStr: string): Promise<Holiday | null> {
  const snap = await holidaysCol.where("date", "==", dateStr).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return { id: doc.id, ...doc.data() } as Holiday;
}

// ── PAYROLL ────────────────────────────────────────────────────────

export async function generatePayrollForMonth(
  month: number,
  year: number,
): Promise<PayrollRecord[]> {
  // Archived apprentices are skipped entirely — no fresh payroll doc gets
  // written for them, and (for the stipend-slips cron) no signing email
  // goes out. Their payroll docs from before they were archived are left
  // untouched in Firestore; getPayrollForMonth() filters those out on read.
  const apprentices = await getActiveApprentices();
  const daysInMonth = new Date(year, month, 0).getDate();
  const generatedAt = new Date().toISOString();

  const records: PayrollRecord[] = [];
  for (const apprentice of apprentices) {
    const approvedLeave = await getApprovedLeaveForMonth(apprentice.id, month, year);
    const regularLeave = approvedLeave.reduce((sum, r) => sum + r.noOfDays, 0);
    const lopDays = await getTotalLOPForMonth(apprentice.id, month, year);
    const perDayRate = apprentice.stipend / daysInMonth;
    const deduction = Math.round(perDayRate * lopDays);
    const finalPayment = apprentice.stipend - deduction;

    const record: Omit<PayrollRecord, "id"> = {
      apprenticeId: apprentice.id,
      apprenticeName: apprentice.name,
      apprenticeEmail: apprentice.email,
      month,
      year,
      stipend: apprentice.stipend,
      regularLeave,
      lopDays,
      deduction,
      finalPayment,
      generatedAt,
    };

    const docId = `${apprentice.id}_${year}_${month}`;
    await payrollCol.doc(docId).set(record, { merge: true });
    records.push({ id: docId, ...record });
  }

  return records;
}

export async function getPayrollForMonth(month: number, year: number): Promise<PayrollRecord[]> {
  const [snap, activeApprentices] = await Promise.all([
    payrollCol.where("month", "==", month).where("year", "==", year).get(),
    getActiveApprentices(),
  ]);
  // A payroll doc can predate an apprentice being archived — filter those
  // out here so every reader (dashboards, sign-slip, payslip history) sees
  // an archived apprentice excluded immediately, without needing payroll
  // to be regenerated first.
  const activeIds = new Set(activeApprentices.map((a) => a.id));
  return snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as PayrollRecord)
    .filter((r) => activeIds.has(r.apprenticeId));
}

// ── STIPEND SLIPS ──────────────────────────────────────────────────

export async function getStipendSlipsByApprentice(apprenticeId: string): Promise<StipendSlip[]> {
  const snap = await stipendSlipsCol.where("apprenticeId", "==", apprenticeId).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as StipendSlip);
}

export async function createOrUpdateStipendSlip(
  apprenticeId: string,
  month: number,
  year: number,
  data: Partial<Omit<StipendSlip, "id" | "apprenticeId" | "month" | "year">>,
): Promise<void> {
  const docId = `${apprenticeId}_${year}_${month}`;
  await stipendSlipsCol.doc(docId).set({ apprenticeId, month, year, ...data }, { merge: true });
}

// ── SYSTEM CONFIG ──────────────────────────────────────────────────

export async function getConfig(key: string): Promise<string> {
  const doc = await systemConfigCol.doc(key).get();
  return (doc.data()?.value as string) ?? "";
}

export async function getAllConfig(): Promise<Record<string, string>> {
  const snap = await systemConfigCol.get();
  const config: Record<string, string> = {};
  for (const doc of snap.docs) {
    config[doc.id] = (doc.data().value as string) ?? "";
  }
  return config;
}

export async function setConfig(key: string, value: string): Promise<void> {
  await systemConfigCol.doc(key).set({ value }, { merge: true });
}
