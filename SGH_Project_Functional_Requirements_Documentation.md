# SGH App — Functional Requirements Documentation

**Project:** St George Hospital Management System (SGH App)  
**Stack:** Laravel 11 + Sanctum (backend) • React 18 + Vite (frontend)  
**Auth:** Token-based (Sanctum), role middleware, MFA for Admin/Branch Manager  
**API Base:** `http://localhost:8000/api`  
**Frontend Dev:** `http://localhost:5173`  
**Date:** 2026-09-01  
**Audience:** Lecturers, team members, supervisors  

---

## Table of Contents

1. [Core Domain & Architecture](#core-domain--architecture)
2. [Functional Requirements Index](#functional-requirements-index)
3. [Detailed FR Specifications](#detailed-fr-specifications)
   - [FR1–FR10: Branch & Staff Management](#fr1fr10-branch--staff-management)
   - [FR11–FR15: Patient Management](#fr11fr15-patient-management)
   - [FR16–FR20: Appointments & Scheduling](#fr16fr20-appointments--scheduling)
   - [FR21–FR25: Staff Records & Schedules](#fr21fr25-staff-records--schedules)
   - [FR26–FR30: Pharmacy & Inventory](#fr26fr30-pharmacy--inventory)
   - [FR31–FR35: Laboratory](#fr31fr35-laboratory)
   - [FR36–FR40: Billing & Payments](#fr36fr40-billing--payments)
   - [FR41–FR44: Reports & Analytics](#fr41fr44-reports--analytics)
   - [FR45–FR48: AI & Feedback](#fr45fr48-ai--feedback)
   - [FR49–FR64: Proposed / Extended](#fr49fr64-proposed--extended)
4. [Key Deviations from SRS (Flagged for Supervisor)](#key-deviations-from-srs-flagged-for-supervisor)
5. [Technical Implementation Notes](#technical-implementation-notes)
6. [Test Evidence Summary](#test-evidence-summary)
7. [Known Limitations](#known-limitations)

---

## Core Domain & Architecture

| Layer | Technology | Location |
|-------|------------|----------|
| Backend API | Laravel 11, PHP 8.2, Sanctum | `backend/` |
| Frontend | React 18, Vite, Tailwind-ish CSS | `src/` |
| Database | MySQL 8 (via XAMPP) | `backend/database/migrations/` |
| Auth | Sanctum token + `role:` middleware + `audit` middleware | `backend/app/Http/Middleware/` |
| Payment | Stripe test-mode via PaymentIntents (sandbox default) | `backend/app/Services/PaymentGatewayService.php` |

**Role Constants** (used in `role:{$role}` middleware):
- `Admin` — full system access
- `Branch Manager` — branch-scoped admin
- `Doctor` — clinical actions, prescriptions, lab orders
- `Nurse` — observations, procedures
- `Receptionist` — patient registration, bookings, billing
- `Lab Technician` — lab results
- `Pharmacist` — dispensing, inventory
- `Patient` — self-service portal

---

## Functional Requirements Index

| FR Range | Area | Status | Key Files |
|----------|------|--------|-----------|
| FR1–FR5 | Project setup / core | ✅ | — |
| FR6–FR10 | Branches | ✅ | `BranchController`, `Branch` model |
| FR11–FR15 | Patients | ✅ | `PatientController`, `Patient` model |
| FR16–FR20 | Appointments | ✅ *with deviation* | `AppointmentController`, `BillingService` |
| FR21–FR25 | Staff & Schedules | ✅ | `StaffController`, `Staff` model, `Schedule` |
| FR26–FR30 | Pharmacy | ✅ | `PharmacyController`, `Medicine`, `Prescription` |
| FR31–FR35 | Laboratory | ✅ | `LabController`, `LabOrder`, `LabResult` |
| FR36–FR40 | Billing & Payments | ✅ | `BillingController`, `BillingService`, `PaymentGatewayService`, `StripeCheckoutModal` |
| FR41–FR44 | Reports | ✅ | `ReportController` |
| FR45–FR48 | AI & Feedback | ⚠️ FR46 only | `AiChatController` (FR46), others deferred |
| FR49–FR64 | Extended | Mixed | Various |

---

## Detailed FR Specifications

### FR1–FR10: Branch & Staff Management

| FR | Title | Description | Endpoint(s) |
|----|-------|-------------|-------------|
| FR6 | Create Branch | Admin creates branch with name, state, address, contact, capacity | `POST /branches` (Admin) |
| FR7 | Update Branch | Admin/Branch Manager updates branch details | `PUT /branches/{id}` |
| FR8 | Delete Branch | Admin deletes branch | `DELETE /branches/{id}` |
| FR9 | Assign Staff to Branch | Admin assigns staff member to a branch | `POST /branches/{id}/assign-staff` |
| FR10 | List Branches | Admin/Manager views branches with statistics | `GET /branches`, `GET /branches/{id}/statistics` |

**Data Model:** `branches` table, `Branch` model, `staff.branch_id` FK

---

### FR11–FR15: Patient Management

| FR | Title | Description | Endpoint(s) |
|----|-------|-------------|-------------|
| FR11 | Register Patient | Receptionist/Admin creates patient record (validates unique email/contact) | `POST /patients` |
| FR12 | View Patient | Authorized roles view patient details | `GET /patients/{id}` |
| FR13 | Update Patient | Patient/Receptionist/Admin updates record | `PUT /patients/{id}` |
| FR14 | Medical Records | Doctor/Nurse/Admin views patient medical history | `GET /patients/{id}/medical-records` |
| FR15 | Duplicate Detection | Admin/Manager reviews potential duplicate patients | `GET /patient-duplicates` |

**Data Model:** `patients` table (linked to `users`), global ID format `SGH-PT-{seq}`

---

### FR16–FR20: Appointments & Scheduling ⭐ **KEY FEATURE**

| FR | Title | SRS Spec | Implementation |
|----|-------|----------|----------------|
| FR16 | Patient Books Appointment | Patient "requests" appointment | `POST /appointments` (Patient) |
| FR17 | View Doctor Availability | Real-time schedules minus booked slots | `GET /doctors/{id}/availability?date=...` |
| FR18 | Confirm Appointment | **SRS: Receptionist approves (Must)** | **DEVIATION: Instant auto-confirm when slot free** |
| FR19 | Conflict Prevention | Transactional overlap check + unique index | `lockForUpdate` + unique `(doctor_staff_id, appointment_date, start_time)` |
| FR20 | Notifications | Queued confirmation/reminder emails | `Notification` model, `appointment_confirmed` template |

#### FR18 Deviation (Documented & Flagged)
| Aspect | SRS (FR18) | Implemented |
|--------|------------|-------------|
| Confirmation | Receptionist manually approves | **Instant auto-confirm** if slot free |
| Backstop | Manual review | `lockForUpdate` + unique DB index → 409 + alternatives |
| Actor/Reason Recording | Required | Preserved via `updateStatus()` for reject/cancel/complete |

**Rationale:** Slot-aware booking already guarantees doctor availability; manual approval is redundant. Deviation is **explicitly documented** in `FR_PROGRESS.md` and flagged for supervisor approval.

#### Booking → Invoice Flow (New)
1. **At Booking** → `generateForBooking()` creates **Pending invoice with consultation only** (General $85 / Specialist $150 from branch price list). Returns `invoice_id` in 201 response. Patient sees "Pay online" immediately.
2. **If Cancelled/Rejected** → Unpaid Pending invoice **voided** (deleted).
3. **At Completion** → `generateForAppointment()` **appends** linked labs + procedures to the **same invoice** (no double-charge). If booking invoice was already paid, creates **supplementary invoice** for remaining items.

---

### FR21–FR25: Staff Records & Schedules

| FR | Title | Description | Endpoint(s) |
|----|-------|-------------|-------------|
| FR21 | Create Staff | Admin creates staff record with role, branch, designation | `POST /staff` |
| FR22 | View Staff | Authorized roles view staff profile | `GET /staff/{id}` |
| FR23 | Staff Schedules | Doctor/Admin manages recurring availability | `GET/POST /staff/{id}/schedules` |
| FR24 | Medical Records | Doctor/Nurse adds clinical notes to patient | `POST /staff/{id}/medical-records` |
| FR25 | Prescriptions | Doctor creates prescriptions | `POST /staff/{id}/prescriptions` |

**Data Model:** `staff` table (linked to `users` + `branches`), `schedules` table (recurring or date-specific)

---

### FR26–FR30: Pharmacy & Inventory

| FR | Title | Description | Endpoint(s) |
|----|-------|-------------|-------------|
| FR26 | Medicine Catalog | Pharmacist/Admin manages medicines per branch | `GET/POST /medicines` |
| FR27 | Low Stock Alert | Auto-flag medicines below threshold | `GET /medicines/low-stock` |
| FR28 | Prescriptions | Doctor creates, Pharmacist dispenses | `POST /prescriptions/{id}/dispense` |
| FR29 | Purchase Orders | Pharmacist/Admin orders stock | `POST /medicines/{id}/purchase-order` |
| FR30 | Prescription Status | Track dispensed/partial/pending | `PATCH /prescriptions/{id}/status` |

**Data Model:** `medicines` (branch-scoped), `prescriptions`, `prescription_items`

---

### FR31–FR35: Laboratory

| FR | Title | Description | Endpoint(s) |
|----|-------|-------------|-------------|
| FR31 | Create Lab Order | Doctor orders test for patient (links to appointment) | `POST /lab-orders` |
| FR32 | Upload Result | Lab Tech uploads result + PDF | `POST /lab-orders/{id}/results` |
| FR33 | Release Result | Lab Tech/Doctor releases to patient | `POST /lab-results/{id}/release` |
| FR34 | Download Result | Patient downloads PDF | `GET /lab-results/{id}/download` |
| FR35 | Lab Order Status | Track requested → in_progress → completed | Auto-updated |

**Data Model:** `lab_orders` (with `appointment_id` FK), `lab_results`

---

### FR36–FR40: Billing & Payments ⭐ **CORE PAYMENT FLOW**

| FR | Title | Description |
|----|-------|-------------|
| FR36 | Configured Charges | All prices from branch `services` table (not hardcoded) |
| FR37 | Itemised Invoice | One invoice per completed appointment: consultation + labs + procedures |
| FR38 | Invoice PDF | Downloadable invoice |
| FR39 | Payment Recording | Receptionist/Admin records cash/card payments |
| FR40 | Stripe Gateway | **TEST MODE** — sandbox default; Stripe PaymentIntents; Elements tokenizes card client-side |

#### Payment Architecture (Two-Backend Adapter)

```
┌─────────────────────────────────────────────────────────────┐
│                   PaymentGatewayService                      │
│  provider() → 'stripe' | 'sandbox' (degrades if no key)    │
├──────────────────────────┬──────────────────────────────────┤
│       Stripe             │           Sandbox                 │
│  createIntent → real     │  createIntent → sandbox_{uuid}    │
│  PaymentIntent +         │  confirmIntent → always success   │
│  client_secret           │  refund → refund_{uuid}           │
└──────────────────────────┴──────────────────────────────────┘
```

#### Config (`.env` — **all blank by default, safe for sandbox**)
```bash
PAYMENT_GATEWAY_PROVIDER=sandbox        # or 'stripe'
PAYMENT_GATEWAY_KEY=sk_test_...         # Stripe SECRET key (Dashboard → Developers → API keys)
PAYMENT_GATEWAY_PUBLISHABLE=pk_test_... # Stripe PUBLISHABLE key (safe for browser)
PAYMENT_GATEWAY_SECRET=whsec_...        # Webhook secret (optional)
PAYMENT_GATEWAY_CURRENCY=aud            # AUD, minor units
```

#### Endpoints
| Method | Endpoint | Roles | Purpose |
|--------|----------|-------|---------|
| POST | `/invoices` | Admin/Manager/Receptionist | Create manual invoice |
| GET | `/invoices` | Patient + staff | List invoices |
| GET | `/invoices/{id}` | Owner + staff | View invoice + items |
| GET | `/invoices/{id}/pdf` | Owner + staff | Download PDF |
| POST | `/invoices/{id}/checkout` | Patient/Receptionist/Admin | Create Stripe PaymentIntent (returns `client_secret`) |
| POST | `/invoices/{id}/confirm` | Patient/Receptionist/Admin | Server verifies PaymentIntent, records Payment, marks invoice Paid |
| POST | `/invoices/{id}/pay` | Patient/Receptionist/Admin | Legacy sandbox-only path |
| POST | `/payments/{id}/refund` | Receptionist/Admin | Refund (FR64) |

#### Frontend: `StripeCheckoutModal`
- Lazy-loads `https://js.stripe.com/v3/`
- Mounts Elements card field (`#stripe-card-element`)
- Test card: **4242 4242 4242 4242** (any future expiry, any CVV)
- Sandbox mode: one-tap "Pay now (test mode)"

---

### FR41–FR44: Reports & Analytics

| FR | Title | Endpoint |
|----|-------|----------|
| FR41 | Summary Report | `GET /reports/summary` |
| FR42 | Trend Report | `GET /reports/trend` |
| FR43 | Department Comparison | `GET /reports/department-comparison` |
| FR44 | Export CSV/PDF | `GET /reports/export.csv`, `/export.pdf` |

**Roles:** Admin, Branch Manager only

---

### FR45–FR48: AI & Feedback

| FR | Title | Status | Notes |
|----|-------|--------|-------|
| FR45 | — | — | — |
| FR46 | AI Chatbot | ✅ | OpenRouter Nemotron free model; server-side privacy gate escalates clinical/emergency before external call |
| FR47 | Sentiment Analysis | ⏳ Deferred | Feedback sentiment classification |
| FR48 | AI Insights | ⏳ Deferred | Predictive analytics |

**FR46 Details:** `POST /ai/chat` — any authenticated role. Audited as `AI_CHAT`.

---

### FR49–FR64: Proposed / Extended Features

| FR | Title | Status | Notes |
|----|-------|--------|-------|
| FR49 | Consent Management | ✅ | Patient consent records + withdrawal |
| FR50 | MFA Enrolment | ✅ | TOTP via `MfaController`; mandatory for Admin/Manager |
| FR51 | Break-Glass Access | ✅ | Emergency record access with audit + revocation |
| FR52–FR54 | Wards/Beds/Admissions | ✅ | Bed management, admissions, observations |
| FR55 | Rich Audit Filters | ✅ | CSV export + filters |
| FR56 | — | — | — |
| FR57–FR58 | Backup Jobs | ✅ | Scheduled backups + restore drills |
| FR59 | System Settings | ✅ | Key-value settings store |
| FR60 | Branch-Scoped Inventory | ✅ | Threshold/price per branch |
| FR61 | Data Access Requests | ✅ | Patient GDPR-style requests |
| FR62 | Duplicate Patient Merge | ✅ | Admin review + merge/dismiss |
| FR63 | — | — | — |
| FR64 | Payment Webhook/Refund | ✅ | `POST /payments/callback`, staff-initiated refund |

---

## Key Deviations from SRS (Flagged for Supervisor)

| # | SRS Requirement | Implementation | Documentation |
|---|-----------------|----------------|---------------|
| 1 | **FR18: Receptionist approves appointments** | **Instant auto-confirm** when slot is free (FR19 lockForUpdate + unique index backstop) | `FR_PROGRESS.md` "Appointment booking" section |
| 2 | Invoice only at completion | **Invoice at booking** (consultation) + append at completion | `FR_PROGRESS.md` "Consultation invoice at booking time" |

> **Supervisor Action Required:** Review and approve the two documented deviations above before final submission.

---

## Technical Implementation Notes

### Payment Flow (Stripe Test Mode)
```javascript
// Frontend: StripeCheckoutModal.jsx
1. Fetch /invoices/{id}/checkout → { client_secret, gateway_reference }
2. Stripe Elements: confirmCardPayment(client_secret, { payment_method: { card } })
3. POST /invoices/{id}/confirm with gateway_reference
4. Server: retrieves PaymentIntent → if succeeded, records Payment + marks invoice Paid
```

### Audit Trail
- All mutating endpoints wrapped in `audit` middleware
- `audit_logs` table: `actor_id`, `actor_role`, `action`, `object_type`, `object_id`, `outcome` (success/failure ONLY), `source`, `ip_address`
- Key actions: `INVOICE_AUTO_GENERATED`, `INVOICE_SUPPLEMENTARY_CREATED`, `APPOINTMENT_BOOKED`, `APPOINTMENT_COMPLETED`, `PAYMENT_RECEIVED`, `AI_CHAT`, `BREAK_GLASS`

### MFA
- Admin & Branch Manager **must** enable MFA (enforced by `RequireMfaSetup` middleware)
- Second login step: `POST /auth/mfa/verify` (outside auth group)
- Setup: `POST /mfa/setup` → `POST /mfa/enable`

### Branch Scoping
- Most resources scoped to `branch_id` via middleware / query filters
- Patient sees only their branch; Branch Manager sees their branch only

---

## Test Evidence Summary

| Feature | Test Method | Result |
|---------|-------------|--------|
| Appointment instant confirm | `POST /appointments` (free slot) | `201 { status: "confirmed", invoice_id: 10 }` |
| Double-book conflict | Same slot twice | `409 "That time slot is no longer available."` |
| Consultation invoice at booking | Invoice 10 after booking | Pending, 1 line: "General Consultation" $85 |
| Cancel → invoice voided | PATCH status=cancelled | Invoice deleted |
| Complete → append labs | Late lab order on completed appt | Invoice total $85 → $130 (appended) |
| Complete when paid → supplementary | Pay invoice, then late procedure | New invoice 9 ($120), original stays paid |
| Stripe checkout + confirm | `/checkout` → `/confirm` | Payment success, invoice Paid |
| Refund (FR64) | `POST /payments/{id}/refund` | Refund recorded, invoice stays Paid |
| FR46 AI chat | `POST /ai/chat` | Response returned, audited |
| MFA flow | Login → verify TOTP | Works for Admin/Manager |
| `npm run build` | Frontend production build | ✅ Clean (chunk warning pre-existing) |

---

## Known Limitations

| Area | Limitation | Status |
|------|------------|--------|
| Walk-in services | Lab orders / procedures with **no `appointment_id`** are never auto-invoiced | **Documented, out of scope** — records exist but no invoice generated |
| FR47/FR48 | Sentiment analysis & AI insights | **Deferred** — not implemented |
| Browser E2E | No automated browser testing (Puppeteer/Playwright unavailable) | Manual verification only |
| Stripe live test | Requires `sk_test_` / `pk_test_` in `.env` | Not tested live — only sandbox verified |

---

## Quick Reference for Lecturers / Team

| To Test | Run |
|---------|-----|
| Seed demo data (optional, from scratch) | `cd backend && /c/xampp2/php/php.exe artisan migrate:fresh --seed` |
| Start API | `cd backend && /c/xampp2/php/php.exe artisan serve --host=0.0.0.0 --port=8000` |
| Start Frontend | `cd .. && npm run dev` |
| Login Patient | `patient.NSW@example.test` / `Password123!` |
| Login Doctor | `doctor1.NSW@stgeorge.test` / `Password123!` |
| Login Admin | `admin@stgeorge.test` / `Password123!` |
| Login Receptionist / Nurse / Pharmacist / Lab Tech | `receptionist.NSW@` · `nurse.NSW@` · `pharmacist.NSW@` · `lab_technician.NSW@` `stgeorge.test` / `Password123!` |
| Book Appointment | Patient portal → Doctors → select slot → "Confirm booking" |
| View Invoice | Patient portal → Health records → Invoices → "Pay online" |
| Pay (Sandbox) | Click "Pay online" → "Pay now (test mode)" |
| Complete Visit | Doctor portal → **Schedule** → "Mark completed" (only for today's visits) |
| Add Lab | Doctor → Patients → open a patient → "Request Test" → **link it to the visit** |
| Add Procedure | API only — `POST /procedure-bookings` (no UI screen) |

> **Demo accounts are deterministic.** Every login above is generated by the
> seeders from role + branch state (`{role}.{STATE}@stgeorge.test`,
> `patient.{STATE}@example.test`), so they survive a `migrate:fresh --seed`.
> Branch states are `NSW`, `VIC`, `QLD`. Display names are still randomised, so
> the account names on screen will differ between seeds — the logins will not.
> Logging in accepts either the email or the generated username.

---

## File Map (Key Files)

```
backend/
├── app/
│   ├── Http/Controllers/Api/
│   │   ├── AppointmentController.php      # FR16-20, booking + invoice
│   │   ├── BillingController.php          # FR36-40, checkout/confirm
│   │   ├── LabController.php              # FR31-35
│   │   ├── ProcedureBookingController.php # FR37 procedures
│   │   ├── PaymentController.php          # FR64 refund/callback
│   │   └── AiChatController.php           # FR46
│   ├── Services/
│   │   ├── BillingService.php             # Invoice generation logic
│   │   ├── PaymentGatewayService.php      # Stripe/Sandbox adapter
│   │   └── AiService.php                  # FR46 privacy gate
│   └── Models/
│       ├── Appointment.php
│       ├── Invoice.php / InvoiceItem.php
│       ├── LabOrder.php
│       └── ProcedureBooking.php
├── config/
│   └── payments.php                       # Payment gateway config
└── database/migrations/
    ├── 2024_01_04_000001_add_appointment_id_to_lab_orders_table.php
    └── 2024_01_04_000002_create_procedure_bookings_table.php

src/
├── pages/patient/
│   ├── PatientDoctorProfile.jsx           # Booking UI (instant confirm)
│   └── PatientRecords.jsx                 # Invoices tab + StripeCheckoutModal
├── components/ui/
│   └── StripeCheckoutModal.jsx            # Stripe Elements integration
└── services/
    ├── appointmentService.js              # bookAppointment()
    └── billingService.js                  # startCheckout/confirmCheckout
```

---

*Generated 2026-09-01 — this document reflects the implemented state as of the current session. For the latest `FR_PROGRESS.md` and code, see the repository.*