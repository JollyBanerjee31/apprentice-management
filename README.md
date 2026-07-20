# Akamai Apprentice Leave Management System

A web app that replaces spreadsheets and email chains for managing apprentice
leave, extra (unpaid) leave, holidays, and monthly stipend payments — with
every step logged, approved, and communicated automatically.

---

## 1. What is this system?

Think of it as a small HR portal built specifically for Akamai's apprentice
program. It has one shared login page, and shows a different dashboard
depending on who signs in:

- **Apprentices** request leave and see their own leave balance, payslips,
  and history.
- **Managers** approve or reject leave requests from the apprentices who
  report to them.
- **HR** oversees everyone — apprentices, managers, payroll, holidays, and
  system-wide settings.

Nobody types in a username or password. Everyone signs in with their
existing **Google account** (the same "Sign in with Google" button you see
on other websites). The system only lets in people HR has already added —
if your email isn't in the system, Google sign-in works, but the app turns
you away.

## 2. Who uses it, and what can they do?

| Role | In plain terms | What they can do |
|---|---|---|
| **Apprentice** | The person taking leave | Apply for leave, apply for extra (unpaid) leave, see how many leave days are left, view past requests, view and digitally sign monthly stipend slips |
| **Manager** | The apprentice's direct manager | Approve or reject leave requests from their own team, see their team's leave history |
| **HR** | The admin team | Everything a manager can see, plus: add/edit/remove apprentices, approve extra (unpaid) leave, run payroll, manage the public holiday list, manage other HR admins, and change system-wide settings (like how many leave days apprentices get per year) |

A few things worth knowing about how it behaves:

- **"Extra Leave"** means an apprentice wants time off beyond their normal
  allowance. It's unpaid — the system automatically works out how much to
  deduct from that month's stipend, and HR (not the manager) has to approve
  it.
- **Removing an apprentice is non-destructive.** HR can "archive" an
  apprentice from the Apprentices page instead of permanently deleting
  them. An archived apprentice immediately loses access to the portal, but
  all their leave history and stipend records are kept, and HR can restore
  them at any time from the "Archived" tab.
- **There's always at least one HR admin**, and HR can add more from the
  "HR Team" page. Every HR admin sees the same things and gets the same
  emails — there's no "senior" vs "junior" HR distinction.

## 3. Automatic emails

The system sends emails on its own at specific moments — nobody has to
remember to notify anyone. Here's exactly when each one fires:

| # | Email | Sent to | Sent when |
|---|---|---|---|
| 1 | "Your leave request has been submitted" | The apprentice | An apprentice submits a normal (Casual/Sick or Annual) leave request |
| 2 | "\[Name] requested leave — approval needed" | Their manager | Same moment as #1 — the manager is asked to approve or reject |
| 3 | "Your leave request has been approved / rejected" | The apprentice | The moment their manager makes a decision |
| 4 | "Your extra leave request has been submitted" | The apprentice | An apprentice submits an Extra Leave (unpaid) request |
| 5 | "Action Required: Extra Leave (LOP) for \[Name]" | **Every** HR admin | Same moment as #4 — HR is asked to approve or reject |
| 6 | "Your extra leave request has been approved / rejected" | The apprentice | The moment HR makes a decision on an extra leave request |
| 7 | "Your stipend slip for \[Month] is ready" | The apprentice | Automatically, on the **1st of every month** — the system generates last month's payroll and asks the apprentice to review and digitally sign it |
| 8 | "Stipend Acknowledged — \[Name]" (with a signed PDF attached) | **Every** HR admin | The moment an apprentice signs their stipend slip |
| 9 | "Payroll Input File — \[Month]" (with an Excel file attached) | **Every** HR admin | Automatically, on the **20th of every month** — a ready-to-import payroll spreadsheet for that month |
| 10 | "You've been added to the Akamai Leave System HR team" | The new HR admin | HR adds a new person to the HR Team page |

Two patterns worth calling out:

- Every email that goes to "HR" goes to **all** HR admins at once, not just
  one person — so nothing gets missed if someone is out of office.
- If the mail server is ever misconfigured or down, the app quietly logs
  the failure instead of breaking the feature the email was attached to
  (e.g. a leave request still gets submitted even if the confirmation
  email fails to send).

## 4. Getting the project running (for developers)

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A Google account you're happy to create a free [Firebase](https://firebase.google.com/)
  project and [Google Cloud](https://console.cloud.google.com/) OAuth client under

### Step 1 — Install dependencies

```bash
npm install
```

### Step 2 — Create a Firebase project (this is the database)

1. Go to the [Firebase Console](https://console.firebase.google.com/) and
   click **Add project** (it's free for this scale of usage).
2. Once created, go to **Build → Firestore Database** and click
   **Create database** (start in production mode).
3. Go to **Project settings** (gear icon, top left) → **General** tab, and
   scroll down to **Your apps**. Click the **Web** icon (`</>`) to register
   a web app. Firebase will show you a config block — that's where the
   `NEXT_PUBLIC_FIREBASE_*` values below come from.
4. Still in **Project settings**, go to the **Service accounts** tab, and
   click **Generate new private key**. This downloads a JSON file — that's
   where the `FIREBASE_ADMIN_*` values below come from.

### Step 3 — Set up "Sign in with Google"

1. Go to the [Google Cloud Console credentials page](https://console.cloud.google.com/apis/credentials)
   (use the **same Google account/project** as your Firebase project, or
   link them — Firebase projects are Google Cloud projects under the hood).
2. Click **Create Credentials → OAuth client ID**. Choose **Web application**.
3. Under **Authorized redirect URIs**, add:
   `http://localhost:3000/api/auth/callback/google` (for local development).
   When you deploy the app later, add the same path on your real domain too,
   e.g. `https://your-domain.com/api/auth/callback/google`.
4. Save — you'll be shown a **Client ID** and **Client secret**. That's
   `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` below.

### Step 4 — Set up the outbound email account (optional but recommended)

The automatic emails in section 3 are sent via a Gmail account.

1. Use a Gmail account you're comfortable having send these emails (a
   shared/team mailbox is ideal, not a personal one).
2. Turn on 2-Step Verification on that account:
   [Google Account → Security](https://myaccount.google.com/security).
3. Once 2-Step Verification is on, go to
   [Google Account → App Passwords](https://myaccount.google.com/apppasswords)
   and generate a new App Password. This is **not** the account's normal
   password — it's a 16-character code made specifically for apps like
   this one.
4. That Gmail address is `EMAIL_FROM`, and the app password is
   `EMAIL_PASSWORD` below. If you skip this step, the app still runs fine —
   it just logs a warning and skips sending the email instead of crashing.

### Step 5 — Fill in your environment file

Copy the example file:

```bash
cp .env.example .env.local
```

Then fill in each value:

| Variable | What it's for | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web app config | Firebase Console → Project settings → General → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase web app config | Same as above |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase web app config | Same as above |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase web app config | Same as above |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase web app config | Same as above |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase web app config | Same as above |
| `FIREBASE_ADMIN_PROJECT_ID` | Lets the server read/write the database | The service-account JSON file from Step 2.4 (`project_id` field) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Same | Same JSON file (`client_email` field) |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Same | Same JSON file (`private_key` field) — keep the quotes and `\n` characters exactly as downloaded |
| `NEXTAUTH_URL` | The app's own address | `http://localhost:3000` for local development; your real domain once deployed |
| `NEXTAUTH_SECRET` | Encrypts login sessions | Generate one yourself: run `openssl rand -base64 32` in a terminal and paste the result |
| `AUTH_TRUST_HOST` | Required when deployed behind a proxy (e.g. Vercel) | Always `true` |
| `GOOGLE_CLIENT_ID` | "Sign in with Google" | Step 3.4 above |
| `GOOGLE_CLIENT_SECRET` | "Sign in with Google" | Step 3.4 above |
| `EMAIL_FROM` | The Gmail address that sends notification emails | Step 4.1 above |
| `EMAIL_PASSWORD` | Lets the app send mail as that Gmail account | The App Password from Step 4.3 above (not the regular Gmail password) |
| `CRON_SECRET` | Confirms scheduled jobs (section 3, rows 7 & 9) are really coming from Vercel and not a stranger | Generate one yourself: run `openssl rand -base64 32` |

### Step 6 — Add your first users

New users can't sign in until HR has already added them to the database —
but on a brand-new setup, there's no HR user yet either. `scripts/seed.ts`
solves that chicken-and-egg problem by creating one HR, one manager, and one
apprentice directly.

1. Open `scripts/seed.ts` and replace the three placeholder email addresses
   near the top with real Gmail addresses you can sign into.
2. Run it:

   ```bash
   npm run seed
   ```

3. From then on, sign in as the HR user and use the **HR Team** and
   **Apprentices** pages in the app itself to add everyone else — no more
   script editing needed.

### Step 7 — Run it

```bash
npm run dev
```

Visit `http://localhost:3000` and sign in with one of the Google accounts
you seeded.

## 5. Deploying

This project is built for [Vercel](https://vercel.com/), which is also
where the two scheduled jobs from section 3 (stipend slips on the 1st,
payroll file on the 20th) are configured — see `vercel.json`. When
deploying:

1. Add every environment variable from the table above in the Vercel
   project's **Settings → Environment Variables**.
2. Update `NEXTAUTH_URL` to your real domain.
3. Add `https://your-domain.com/api/auth/callback/google` as an extra
   authorized redirect URI in the Google Cloud Console (Step 3.3 above) —
   keep the `localhost` one too if you still develop locally.

## 6. Built with

Next.js, TypeScript, Tailwind CSS, shadcn/ui, Firebase (Firestore),
NextAuth.js (Google sign-in), and Nodemailer (Gmail SMTP) for the emails
described above.
