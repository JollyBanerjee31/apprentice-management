import { config } from "dotenv";

config({ path: ".env.local" });

const COLLECTIONS = [
  "users",
  "holidays",
  "leaveRequests",
  "extraLeaveRequests",
  "payroll",
  "stipendSlips",
  "systemConfig",
];

const BATCH_SIZE = 300;

async function deleteCollection(
  db: FirebaseFirestore.Firestore,
  name: string,
): Promise<number> {
  const col = db.collection(name);
  let total = 0;

  while (true) {
    const snapshot = await col.limit(BATCH_SIZE).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    for (const doc of snapshot.docs) batch.delete(doc.ref);
    await batch.commit();

    total += snapshot.size;
    if (snapshot.size < BATCH_SIZE) break;
  }

  return total;
}

async function clean() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;

  if (!process.argv.includes("--yes")) {
    console.error(
      `This will permanently delete ALL documents in project "${projectId}" ` +
        `from: ${COLLECTIONS.join(", ")}.\n` +
        `Re-run with --yes to confirm: npm run clean-db -- --yes`,
    );
    process.exit(1);
  }

  const { adminDb } = await import("../src/lib/firebase-admin");

  console.log(`Deleting all data from project "${projectId}"...\n`);

  for (const name of COLLECTIONS) {
    const count = await deleteCollection(adminDb, name);
    console.log(`Deleted ${count} document(s) from "${name}"`);
  }

  console.log("\nClean complete.");
}

clean()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });