// import * as dotenv from 'dotenv'
// import * as path from 'path'

// // Load env vars first — before anything else
// dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
// // Debug — remove after fixing
// console.log('KEY LENGTH:', process.env.FIREBASE_PRIVATE_KEY?.length)
// console.log('KEY START:', process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50))

// // Initialize Firebase Admin inline — not via the shared lib
// import { initializeApp, getApps, cert } from 'firebase-admin/app'
// import { getFirestore } from 'firebase-admin/firestore'

// const app = getApps().length === 0
//   ? initializeApp({
//       credential: cert({
//         projectId:   process.env.FIREBASE_PROJECT_ID!,
//         clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
//         privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//       }),
//     })
//   : getApps()[0]

// const adminDb = getFirestore(app)

// import type { AppUser, Holiday } from "../src/types/index"
import { adminDb } from "../src/lib/firebase-admin";
import type { AppUser, Holiday } from "../src/types/index";

// Fill in with real Gmail addresses before running
const HR_EMAIL         = "jobanerj@akamai.com"
const MANAGER_EMAIL    = "jollyban1996@gmail.com"
const APPRENTICE_EMAIL = "banerjeejolly0196@gmail.com"

async function seed() {
  for (const email of [HR_EMAIL, MANAGER_EMAIL, APPRENTICE_EMAIL]) {
    if (email.startsWith("REPLACE_WITH_")) {
      throw new Error(
        "scripts/seed.ts still has placeholder emails — fill in HR_EMAIL, MANAGER_EMAIL, and APPRENTICE_EMAIL first.",
      );
    }
  }

  const createdAt = new Date().toISOString();
  const usersCol = adminDb.collection("users");

  const hr: Omit<AppUser, "id"> = {
    email: HR_EMAIL,
    name: "Jolly Banerjee",
    role: "hr",
    hireDate: "2020-01-01",
    totalLeave: 0,
    stipend: 0,
    createdAt,
  };
  const hrRef = await usersCol.add(hr);
  console.log(`Created HR user: ${hrRef.id}`);

  const manager: Omit<AppUser, "id"> = {
    email: MANAGER_EMAIL,
    name: "Jolly Manager",
    role: "manager",
    hireDate: "2020-01-01",
    totalLeave: 0,
    stipend: 0,
    createdAt,
  };
  const managerRef = await usersCol.add(manager);
  console.log(`Created manager user: ${managerRef.id}`);

  const apprentice: Omit<AppUser, "id"> = {
    email: APPRENTICE_EMAIL,
    name: "Jolly Apprentice",
    role: "apprentice",
    hireDate: "2024-01-01",
    totalLeave: 12,
    stipend: 30000,
    managerId: managerRef.id,
    managerEmail: MANAGER_EMAIL,
    managerName: "Jolly Manager",
    createdAt,
  };
  const apprenticeRef = await usersCol.add(apprentice);
  console.log(`Created apprentice user: ${apprenticeRef.id}`);

  const holidays: Omit<Holiday, "id">[] = [
    { date: "2026-08-15", name: "Independence Day", day: "Saturday" },
    { date: "2026-10-02", name: "Gandhi Jayanti", day: "Friday" },
  ];
  const holidaysCol = adminDb.collection("holidays");
  for (const holiday of holidays) {
    await holidaysCol.add(holiday);
  }
  console.log(`Created ${holidays.length} holidays`);

  const systemConfigCol = adminDb.collection("systemConfig");
  await systemConfigCol.doc("hrName").set({ value: "HR Admin" });
  await systemConfigCol.doc("hrEmail").set({ value: HR_EMAIL });
  await systemConfigCol.doc("hrTicketLink").set({ value: "https://support.akamai.com" });
  console.log("Created systemConfig");

  console.log("\nSeed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
