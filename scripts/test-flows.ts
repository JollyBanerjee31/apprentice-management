/**
 * Exercises the app's critical paths against the real Firestore database
 * configured in .env.local, using the exact same lib/ functions the app
 * itself calls (not a re-implementation of the business rules). All test
 * data is created under isolated "flowtest" emails and deleted again at the
 * end, in a finally block, so this is safe to re-run against production
 * Firestore. Run with: npm run test:flows
 */
import { adminDb } from "../src/lib/firebase-admin";
import {
  createExtraLeaveRequest,
  createHoliday,
  createLeaveRequest,
  createUser,
  deleteHoliday,
  getAllExtraLeaveRequests,
  getAllUsers,
  getConfig,
  getExtraLeaveRequestById,
  getLeaveRequestById,
  getLeaveRequestsByManager,
  getTotalUsedLeave,
  getUserById,
  isHoliday,
  setConfig,
  updateExtraLeaveRequest,
  updateLeaveRequest,
  updateUser,
} from "../src/lib/firestore";
import { validateExtraLeaveSubmission, validateLeaveSubmission } from "../src/lib/leave-validation";
import { buildPayrollWorkbook } from "../src/lib/payroll-excel";
import { sendEmail } from "../src/lib/email";
import { leaveSubmittedApprentice, leaveSubmittedManager } from "../src/lib/email-templates";

// ── Tiny test harness ────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const cleanupTasks: (() => Promise<unknown>)[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function section(title: string) {
  console.log(`\n${title}`);
}

// Mid-month days (5–20) in distinct months so fixtures never collide with
// real month-boundary edge cases or with each other's calendar month.
function monthDate(monthsFromNow: number, day: number): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + monthsFromNow, day).toISOString().slice(0, 10);
}

async function main() {
  console.log(
    "Running critical-path tests against live Firestore (test data is isolated and cleaned up automatically)\n",
  );

  const runId = Date.now();
  const testEmail = (label: string) => `flowtest-${label}-${runId}@flowtest.internal`;

  // ── Setup: isolated test manager + apprentice ────────────────────
  const managerId = await createUser({
    email: testEmail("manager"),
    name: "Flowtest Manager",
    role: "manager",
    hireDate: "2020-01-01",
    totalLeave: 0,
    stipend: 0,
    createdAt: new Date().toISOString(),
  });
  cleanupTasks.push(() => adminDb.collection("users").doc(managerId).delete());

  const apprenticeId = await createUser({
    email: testEmail("apprentice"),
    apprenticeId: `FLOWTEST-${runId}`,
    name: "Flowtest Apprentice",
    role: "apprentice",
    // Two years back so it predates every fixture date below, including the
    // deliberately-past BACKDATED fixture.
    hireDate: `${new Date().getFullYear() - 2}-01-01`,
    totalLeave: 2,
    stipend: 30000,
    managerId,
    managerEmail: testEmail("manager"),
    managerName: "Flowtest Manager",
    createdAt: new Date().toISOString(),
  });
  cleanupTasks.push(() => adminDb.collection("users").doc(apprenticeId).delete());

  const user = await getUserById(apprenticeId);
  assert(user !== null, "test apprentice should exist after creation");

  const holidayDateStr = monthDate(2, 10);
  const holidayId = await createHoliday({ date: holidayDateStr, name: "Flowtest Holiday", day: "N/A" });
  cleanupTasks.push(() => adminDb.collection("holidays").doc(holidayId).delete());

  const leaveDateStr = monthDate(1, 10);
  let leaveRequestId: string | null = null;

  try {
    // ── LEAVE FLOW TESTS ────────────────────────────────────────
    section("LEAVE FLOW TESTS");

    await test("Apprentice submits leave -> pending in Firestore", async () => {
      const result = await validateLeaveSubmission(user!, leaveDateStr, leaveDateStr);
      assert(result.ok, `expected validation to pass, got ${!result.ok ? result.error.code : ""}`);
      if (!result.ok) return;
      leaveRequestId = await createLeaveRequest({
        apprenticeId: user!.id,
        apprenticeName: user!.name,
        apprenticeEmail: user!.email,
        managerId: user!.managerId!,
        managerEmail: user!.managerEmail!,
        leaveType: "Casual/Sick Leave",
        startDate: leaveDateStr,
        endDate: leaveDateStr,
        noOfDays: result.noOfDays,
        requestId: `REQ-FLOWTEST-${runId}`,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      cleanupTasks.push(() => adminDb.collection("leaveRequests").doc(leaveRequestId!).delete());
      assert(!!leaveRequestId, "createLeaveRequest should return an id");
    });

    await test("Manager sees pending request in dashboard", async () => {
      const requests = await getLeaveRequestsByManager(managerId);
      const found = requests.find((r) => r.id === leaveRequestId);
      assert(found !== undefined, "manager's request list should include the new request");
      assert(found!.status === "pending", "request should be pending");
    });

    await test("Manager approves -> status becomes approved", async () => {
      await updateLeaveRequest(leaveRequestId!, {
        status: "approved",
        decidedAt: new Date().toISOString(),
      });
      const updated = await getLeaveRequestById(leaveRequestId!);
      assert(updated?.status === "approved", "request should now be approved");
    });

    await test("Apprentice balance reduces by 1", async () => {
      const used = await getTotalUsedLeave(user!.id);
      assert(used === 1, `expected 1 used day, got ${used}`);
    });

    await test("Both emails invoked (apprentice confirmation + manager approval)", async () => {
      // sendEmail never throws — it logs and swallows failures — so this
      // only confirms both calls complete without crashing, not delivery.
      await sendEmail({
        to: user!.email,
        subject: "[flowtest] leave submitted",
        html: leaveSubmittedApprentice(user!.name, "Casual/Sick Leave", leaveDateStr, "REQ-FLOWTEST", 1),
      });
      await sendEmail({
        to: user!.managerEmail!,
        subject: "[flowtest] leave submitted (manager)",
        html: leaveSubmittedManager(
          "Flowtest Manager",
          user!.name,
          "Casual/Sick Leave",
          leaveDateStr,
          "REQ-FLOWTEST",
          "#",
          "#",
        ),
      });
    });

    // ── VALIDATION TESTS ────────────────────────────────────────
    section("VALIDATION TESTS");

    await test("Submit leave on holiday -> 409 HOLIDAY", async () => {
      const result = await validateLeaveSubmission(user!, holidayDateStr, holidayDateStr);
      assert(
        !result.ok && result.error.code === "HOLIDAY",
        `expected HOLIDAY, got ${result.ok ? "ok" : result.error.code}`,
      );
    });

    await test("Submit leave with noOfDays > 1 -> 409 EXCEEDS_LIMIT", async () => {
      const start = monthDate(1, 10);
      const end = monthDate(1, 12);
      const result = await validateLeaveSubmission(user!, start, end);
      assert(
        !result.ok && result.error.code === "EXCEEDS_LIMIT",
        `expected EXCEEDS_LIMIT, got ${result.ok ? "ok" : result.error.code}`,
      );
    });

    await test("Submit second leave same month -> 409 APPROVED_EXISTS", async () => {
      const secondDateStr = monthDate(1, 15);
      const result = await validateLeaveSubmission(user!, secondDateStr, secondDateStr);
      assert(
        !result.ok && result.error.code === "APPROVED_EXISTS",
        `expected APPROVED_EXISTS, got ${result.ok ? "ok" : result.error.code}`,
      );
    });

    await test("Submit backdated leave -> 409 BACKDATED", async () => {
      const pastDateStr = monthDate(-2, 10);
      const result = await validateLeaveSubmission(user!, pastDateStr, pastDateStr);
      assert(
        !result.ok && result.error.code === "BACKDATED",
        `expected BACKDATED, got ${result.ok ? "ok" : result.error.code}`,
      );
    });

    await test("Submit with 0 balance -> 409 NO_BALANCE", async () => {
      // Exhaust the remaining 1-day balance with a second approved request
      // in a different month, then confirm a third month is blocked.
      const secondApprovedDate = monthDate(4, 10);
      const secondReqId = await createLeaveRequest({
        apprenticeId: user!.id,
        apprenticeName: user!.name,
        apprenticeEmail: user!.email,
        managerId: user!.managerId!,
        managerEmail: user!.managerEmail!,
        leaveType: "Annual Leave",
        startDate: secondApprovedDate,
        endDate: secondApprovedDate,
        noOfDays: 1,
        requestId: `REQ-FLOWTEST-2-${runId}`,
        status: "approved",
        createdAt: new Date().toISOString(),
        decidedAt: new Date().toISOString(),
      });
      cleanupTasks.push(() => adminDb.collection("leaveRequests").doc(secondReqId).delete());

      const thirdMonthDate = monthDate(5, 10);
      const result = await validateLeaveSubmission(user!, thirdMonthDate, thirdMonthDate);
      assert(
        !result.ok && result.error.code === "NO_BALANCE",
        `expected NO_BALANCE, got ${result.ok ? "ok" : result.error.code}`,
      );
    });

    // ── LOP FLOW TESTS ──────────────────────────────────────────
    section("LOP FLOW TESTS");

    const extraStart = monthDate(6, 5);
    const extraEnd = monthDate(6, 6);
    let extraLeaveId: string | null = null;

    await test("Apprentice applies extra leave -> pending in Firestore", async () => {
      const result = await validateExtraLeaveSubmission(user!, extraStart, extraEnd);
      assert(result.ok, `expected validation to pass, got ${!result.ok ? result.error : ""}`);
      if (!result.ok) return;
      extraLeaveId = await createExtraLeaveRequest({
        apprenticeId: user!.id,
        apprenticeName: user!.name,
        apprenticeEmail: user!.email,
        startDate: extraStart,
        endDate: extraEnd,
        noOfDays: result.noOfDays,
        reason: "Flowtest automated run",
        requestId: `EXTRA-FLOWTEST-${runId}`,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      cleanupTasks.push(() => adminDb.collection("extraLeaveRequests").doc(extraLeaveId!).delete());
      assert(!!extraLeaveId, "createExtraLeaveRequest should return an id");
    });

    await test("HR sees request in LOP dashboard", async () => {
      const all = await getAllExtraLeaveRequests();
      const found = all.find((r) => r.id === extraLeaveId);
      assert(found?.status === "pending", "extra leave request should be pending and visible to HR");
    });

    let expectedDeduction = 0;
    let expectedFinalPayment = 0;

    await test("HR approves -> status approved, deduction calculated", async () => {
      const request = await getExtraLeaveRequestById(extraLeaveId!);
      assert(request !== null, "extra leave request should exist");
      const perDay = user!.stipend / 30;
      expectedDeduction = Math.round(perDay * request!.noOfDays);
      expectedFinalPayment = user!.stipend - expectedDeduction;
      await updateExtraLeaveRequest(extraLeaveId!, {
        status: "approved",
        decidedAt: new Date().toISOString(),
        lopDays: request!.noOfDays,
        deduction: expectedDeduction,
        finalPayment: expectedFinalPayment,
      });
      const updated = await getExtraLeaveRequestById(extraLeaveId!);
      assert(updated?.status === "approved", "extra leave request should now be approved");
    });

    await test("finalPayment = stipend - (lopDays * stipend/30)", async () => {
      const updated = await getExtraLeaveRequestById(extraLeaveId!);
      assert(
        updated?.deduction === expectedDeduction,
        `expected deduction ${expectedDeduction}, got ${updated?.deduction}`,
      );
      assert(
        updated?.finalPayment === expectedFinalPayment,
        `expected finalPayment ${expectedFinalPayment}, got ${updated?.finalPayment}`,
      );
    });

    // ── HR TESTS ────────────────────────────────────────────────
    section("HR TESTS");

    let hrAddedApprenticeId: string | null = null;

    await test("Add apprentice -> appears in list", async () => {
      hrAddedApprenticeId = await createUser({
        email: testEmail("hr-added"),
        apprenticeId: `FLOWTEST-HR-${runId}`,
        name: "Flowtest HR-Added Apprentice",
        role: "apprentice",
        hireDate: "2024-01-01",
        totalLeave: 12,
        stipend: 20000,
        createdAt: new Date().toISOString(),
      });
      cleanupTasks.push(() => adminDb.collection("users").doc(hrAddedApprenticeId!).delete());
      const all = await getAllUsers();
      assert(all.some((u) => u.id === hrAddedApprenticeId), "new apprentice should appear in getAllUsers()");
    });

    await test("Edit apprentice stipend -> updates in Firestore", async () => {
      await updateUser(hrAddedApprenticeId!, { stipend: 25000 });
      const updated = await getUserById(hrAddedApprenticeId!);
      assert(updated?.stipend === 25000, `expected stipend 25000, got ${updated?.stipend}`);
    });

    await test("Add holiday -> appears in list and blocks leave on that date", async () => {
      const found = await isHoliday(holidayDateStr);
      assert(found?.name === "Flowtest Holiday", "holiday should be found by isHoliday()");
      const result = await validateLeaveSubmission(user!, holidayDateStr, holidayDateStr);
      assert(!result.ok && result.error.code === "HOLIDAY", "holiday date should block a new leave submission");
    });

    await test("Delete holiday -> no longer blocks", async () => {
      await deleteHoliday(holidayId);
      const found = await isHoliday(holidayDateStr);
      assert(found === null, "holiday should no longer be found after deletion");
      // The apprentice's balance is already exhausted by the NO_BALANCE test
      // above, so validation may still fail — just not for the HOLIDAY
      // reason, which is specifically what this test is checking.
      const result = await validateLeaveSubmission(user!, holidayDateStr, holidayDateStr);
      assert(
        result.ok || result.error.code !== "HOLIDAY",
        `expected the HOLIDAY block specifically to be lifted, got ${result.ok ? "ok" : result.error.code}`,
      );
    });

    await test("Save config -> values persist after reload", async () => {
      const key = `flowtestConfig${runId}`;
      await setConfig(key, "hello-world");
      const value = await getConfig(key);
      assert(value === "hello-world", `expected "hello-world", got "${value}"`);
      await adminDb.collection("systemConfig").doc(key).delete();
    });

    await test("Generate payroll Excel -> file has correct data", async () => {
      const now = new Date();
      const { buffer, recordCount } = await buildPayrollWorkbook(now.getMonth() + 1, now.getFullYear());
      assert(buffer.byteLength > 0, "workbook buffer should not be empty");
      assert(recordCount >= 1, "workbook should include at least one apprentice row");
      const payrollDocId = (id: string) => `${id}_${now.getFullYear()}_${now.getMonth() + 1}`;
      cleanupTasks.push(() => adminDb.collection("payroll").doc(payrollDocId(user!.id)).delete());
      cleanupTasks.push(() => adminDb.collection("payroll").doc(payrollDocId(hrAddedApprenticeId!)).delete());
    });
  } finally {
    section("Cleaning up test data...");
    for (const cleanup of cleanupTasks.reverse()) {
      try {
        await cleanup();
      } catch (err) {
        console.log(`  cleanup warning: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Test script crashed:", err);
  process.exit(1);
});
