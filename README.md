# St George Hospital Management System — Frontend Prototype

A frontend-only UI/UX prototype (React + Vite). No backend, no database, no real
login — all data is fake and typed directly into `src/data/mockData.js`. Built
to demonstrate the interface and user flows for the SRS report.

## 1. Folder structure

```
sgh-prototype/
├── index.html                 Vite entry HTML
├── package.json                Dependencies & scripts
├── vite.config.js
├── src/
│   ├── main.jsx                 React entry point
│   ├── App.jsx                  Top-level state: which role, which screen
│   ├── styles/
│   │   └── tokens.css           Colours, fonts, animations (design tokens)
│   ├── data/
│   │   └── mockData.js          All fake demo data — edit freely
│   ├── utils/
│   │   └── statusTone.js        Maps a status word to a badge colour
│   ├── components/
│   │   ├── ui/                  Small reusable pieces (Button, Card, Badge...)
│   │   ├── frames/               PhoneFrame.jsx (mobile shell) + AdminShell.jsx (desktop)
│   │   ├── auth/                 Login.jsx
│   │   ├── patient/               5 patient screens
│   │   ├── doctor/                 3 doctor screens
│   │   ├── staff/                   3 staff screens
│   │   └── admin/                    5 admin screens
```

## 2. Who sees what

| Role | Looks like | Screens |
|---|---|---|
| **Patient** | Phone app | Home, Find a doctor, My appointments, Records/Labs/Invoices, Profile |
| **Doctor** | Phone app | Schedule, Appointment requests, Patient search + notes |
| **Staff** | Phone app | Appointment desk, Record vitals, Pharmacy stock |
| **Admin** | Desktop dashboard | Overview + charts, Branches, Staff, Reports, Audit log |

Patient/Doctor/Staff render inside a phone-frame because the SRS requires a
**native mobile app**. Admin renders as a desktop dashboard because the SRS
says admin access is via a **web browser** (Section 2.4). The login screen has
no real authentication — just four buttons to jump into each role.

## 3. Step-by-step: set up and run in VS Code

### Step 1 — Install prerequisites (once per computer)
1. Install **Node.js** (v18 or later): https://nodejs.org — download the
   "LTS" version and run the installer, default options are fine.
2. Install **VS Code**: https://code.visualstudio.com
3. Confirm both installed correctly. Open a terminal (Terminal app on Mac,
   Command Prompt/PowerShell on Windows) and run:
   ```bash
   node -v
   npm -v
   ```
   Both should print a version number. If not, restart your computer and try again.

### Step 2 — Get the project folder
- Unzip `sgh-prototype.zip` (or `git clone` your team's repo) anywhere on your
  computer, e.g. `Documents/sgh-prototype`.

### Step 3 — Open it in VS Code
1. Open VS Code.
2. `File → Open Folder...` and select the `sgh-prototype` folder (the one
   containing `package.json`, not a folder above or below it).
3. VS Code may ask "Do you trust the authors of this folder?" → click **Yes**.

### Step 4 — Open the built-in terminal
- `Terminal → New Terminal` (or press `` Ctrl+` `` / `` Cmd+` ``). A terminal
  panel opens at the bottom, already pointed at your project folder.

### Step 5 — Install dependencies
In that terminal, run:
```bash
npm install
```
This downloads React, Vite, and the two extra libraries the app uses
(`lucide-react` for icons, `recharts` for the admin charts) into a
`node_modules` folder. Takes 30-90 seconds. You only need to do this once
(and again any time `package.json` changes).

### Step 6 — Run it
```bash
npm run dev
```
This starts a local dev server and should automatically open your browser to
something like `http://localhost:5173`. If it doesn't open automatically,
`Ctrl+click` (or `Cmd+click`) the link printed in the terminal.

You should see the login screen. Click any of the four role buttons (Patient,
Doctor, Staff, Admin) to jump straight into that role's screens.

### Step 7 — Make changes and see them live
With `npm run dev` still running, edit any file and save — the browser
updates automatically (this is "hot reload"). To stop the server, click into
the terminal and press `Ctrl+C`.

### Step 8 — Recommended VS Code extensions (optional but helpful)
Open the Extensions panel (`Ctrl+Shift+X` / `Cmd+Shift+X`) and install:
- **ES7+ React/Redux/React-Native snippets** — faster component scaffolding
- **Prettier – Code formatter** — keeps everyone's code formatted the same way
- **ESLint** — flags obvious JS mistakes as you type

## 4. Where each Functional Requirement lives

| FR range | Feature | File |
|---|---|---|
| FR1–5 | Login / role dashboards | `src/components/auth/Login.jsx` |
| FR16–20 | Appointment booking & filtering | `src/components/patient/PatientFind.jsx`, `PatientDoctorProfile.jsx`, `PatientAppointments.jsx` |
| FR18 | Doctor accepts/rejects requests | `src/components/doctor/DoctorRequests.jsx` |
| FR23 | Doctor treatment notes | `src/components/doctor/DoctorPatients.jsx` |
| FR24 | Nurse vitals entry | `src/components/staff/StaffVitals.jsx` |
| FR26–30 | Pharmacy stock & alerts | `src/components/staff/StaffPharmacy.jsx` |
| FR15, 34, 38 | Patient records / labs / invoices | `src/components/patient/PatientRecords.jsx` |
| FR6–10 | Branch management | `src/components/admin/AdminBranches.jsx` |
| FR5, 21 | Staff management | `src/components/admin/AdminStaff.jsx` |
| FR41–44, 48 | Reports, dashboards, AI insight text | `src/components/admin/AdminReports.jsx`, `AdminOverview.jsx` |
| NFR12 | Audit logging | `src/components/admin/AdminAudit.jsx` |

Not yet built: in-patient/ward admission, prescriptions, full lab
request→result workflow, billing/payment gateway flow, chatbot, system
configuration screens.

## 5. Working as a team without stepping on each other

- **Mock data** lives entirely in `src/data/mockData.js` — safe to edit
  without touching component code.
- **Every screen is its own file.** Adding a new screen = add a new file in
  the right `components/<role>/` folder, following the pattern of an existing
  one, then wire it into `src/App.jsx` (add a tab entry + one line in the
  `{screen === "..." && <NewScreen />}` block).
- **Use Git branches per person/module**, not everyone editing on `main`:
  ```bash
  git checkout -b yourname/billing-screen
  # ... make changes, npm run dev to check them ...
  git add .
  git commit -m "Add billing screen"
  git push -u origin yourname/billing-screen
  ```
  Then open a Pull Request on GitHub so the rest of the team can review before
  merging into `main`.

## 6. Suggested task split (matches the SRS module list)

- **Person A:** In-patient/ward admission screens (Admin + Staff)
- **Person B:** Prescriptions + full lab request→result flow (Doctor + Staff)
- **Person C:** Billing screen with itemised invoice + mock payment step (Patient)
- **Person D:** System configuration screens (Admin) + chatbot UI (Patient)
- Whoever isn't building a screen should be pulling the diagrams (ERD/DFD/use
  case) and written SRS sections together — that's the actual graded artefact
  for Assessment 3; the prototype supports it, not replaces it.

## 7. Known limits (state this in your report, don't hide it)

- No backend, no persistence, no real security — by design (frontend-only scope).
- Login is a role-picker, not real authentication.
- All figures (revenue, occupancy, patient counts) are invented for demo purposes.
- AI features (chatbot, sentiment analysis, report insights — FR46–48) are
  shown as static text/UI, not live API calls.

## 8. Common problems

| Problem | Fix |
|---|---|
| `npm install` fails with permission errors | Don't use `sudo`. On Mac/Linux, fix npm's default directory permissions, or reinstall Node via [nvm](https://github.com/nvm-sh/nvm). |
| Browser shows a blank white page | Check the terminal for a red error message — it's almost always a typo (missing `}`, wrong import path). |
| Port 5173 already in use | Another `npm run dev` is already running somewhere — close that terminal first, or Vite will auto-pick the next free port. |
| Icons or charts don't show up | Run `npm install` again — `lucide-react` or `recharts` may not have installed correctly. |
