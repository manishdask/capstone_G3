# St George Hospital Management System (SGH App)
## Daily Work & Handover Summary — 25 September 2026

This document outlines everything accomplished today, the files modified, git branches, deployment instructions, and how to continue working on this project across other machines/VS Code environments.

---

### 1. Key Accomplishments & Fixes

#### A. Patient Notification Bell
* **Fixed duplicate icons**: Removed the redundant mock notification button and bottom modal from `PatientHome.jsx`.
* **Single functional notification system**: The primary notification bell in `PhoneFrame.jsx` / `NotificationBell.jsx` is now active, connected to `/api/notifications`, displaying live unread counts, and allowing individual/batch "mark as read".

#### B. Patient Dashboard — Quick Actions
* Connected all 4 dashboard quick-action cards to their respective pages/sub-tabs:
  * **Records** ➔ Patient Records (`records` / Medical History)
  * **Lab Report** ➔ Patient Records (`labs` / Lab Reports tab)
  * **Invoice** ➔ Patient Records (`invoices` / Invoices tab)
  * **Reminder** ➔ My Appointments & Reminders tracker (`appts`)

#### C. Find a Doctor (Branch & Category Filtering)
* **Branch Filtering**: Added `"All Branches"` option alongside individual branch selectors. Selecting any branch dynamically filters doctors in real time.
* **Doctor Categories/Specialties**: Made all hospital categories (`All`, `Cardiology`, `Dermatology`, `General Medicine`, `Orthopaedics`, `Paediatrics`, plus custom specialties) available as clickable filter pills.
* **Filter Synchronization**: Branch, specialty, and gender filters combine cleanly and display empty states gracefully when no matching doctors exist.

#### D. Page Refresh & Session / Role Persistence
* **Session Persistence**: Cached the authenticated user model in `localStorage` (`sgh_user`) so refreshing the browser preserves the active session and user role immediately without re-login prompts.
* **Screen Preservation**: Active screen and sub-tab states (`sgh_screen_patient`, `sgh_records_tab`, `sgh_screen_doctor`, `sgh_screen_staff`, `sgh_screen_admin`) are saved and restored on reload.
* **No Admin Auto-Redirect**: Users stay strictly in their respective role workspaces.
* **Error Boundary**: Added `ErrorBoundary.jsx` around all role views to catch render errors and safely provide a "Return to Home" fallback.

---

### 2. Files Modified & Added

| File Path | Status | Description |
|---|---|---|
| `resources/js/pages/patient/PatientHome.jsx` | Modified | Removed duplicate bell, enabled all 4 quick action routes |
| `resources/js/pages/patient/PatientRecords.jsx` | Modified | Added `initialTab` support for direct deep-linking |
| `resources/js/pages/patient/PatientFind.jsx` | Modified | Added All Branches option and complete specialty filter pills |
| `resources/js/AppRoot.jsx` | Modified | Integrated screen persistence, sub-tab routing, and ErrorBoundary |
| `resources/js/context/AuthContext.jsx` | Modified | Persisted user session to prevent role loss / login prompts on F5 |
| `resources/js/components/ui/ErrorBoundary.jsx` | **Created** | Safe error boundary with fallback to Home |
| `config/database.php` | Modified | PHP 8.3 / PDO MySQL SSL attribute compatibility |
| `package.json` | Modified | Added deploy helper scripts |

---

### 3. Git & Repository Information

* **Repository**: `https://github.com/manishdask/capstone_G3.git`
* **Current Working Branch**: `restore/fr20-notifications`
* **Latest Commit**: `7656e51` — *"Fix patient profile notification bell, quick action links, doctor filters, and screen persistence"*

#### To clone and resume on another machine:
```bash
git clone https://github.com/manishdask/capstone_G3.git
cd capstone_G3
git checkout restore/fr20-notifications
git pull

# Install dependencies
composer install
npm install

# Setup local environment (if not already done)
cp .env.example .env
php artisan key:generate
php artisan migrate --seed

# Run dev servers
npm run dev
php artisan serve
```

---

### 4. Production Deployment & Live Server Details

* **Live URL**: [https://g3.mehedihasan.au/](https://g3.mehedihasan.au/)
* **How-To Guide**: [https://g3.mehedihasan.au/how-to/](https://g3.mehedihasan.au/how-to/)
* **SFTP Host**: `mehedihasan.au` | **Port**: `2222` | **User**: `mehedih3_mehedih3_g3` | **Password**: `cpro306`

#### How to Deploy Changes to Production:
1. **Build the frontend for production** (must use `VITE_API_URL=/api`):
   ```powershell
   $env:VITE_API_URL="/api"; npm run build
   ```
2. **Verify no localhost URL is in the bundle**:
   ```bash
   grep -c "127.0.0.1:8000" public/build/assets/*.js
   # Must return 0
   ```
3. **Execute deployment**:
   ```bash
   node tools/deploy_release.cjs --schema-applied --clear-cache
   ```

---

### 5. Demo Accounts for Testing

All demo accounts share the password: `Password123!`

* **Admin**: `admin@stgeorge.test`
* **Patient**: `patient1@stgeorge.test` (or register a new patient via Self-Registration)
* **Doctor**: `doctor1.NSW@stgeorge.test`
* **Nurse**: `nurse.NSW@stgeorge.test`
* **Branch Manager**: `manager.NSW@stgeorge.test`
* **Pharmacist**: `pharmacist.NSW@stgeorge.test`
* **Lab Technician**: `lab_technician.NSW@stgeorge.test`
