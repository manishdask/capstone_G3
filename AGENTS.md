# CLAUDE.md — SGH Hospital Management System (CPRO306 Capstone, Group 3)

Read this before touching anything. It describes a real deployed system with
real constraints. Guessing at them has already cost this team days.

## What this project is

A single Laravel application that serves both an API and a React single-page
app. It is **not** two projects, and the React code is **not** a separate repo.

| Layer | Where it lives |
|---|---|
| API (Laravel 13, PHP 8.3) | `app/`, `routes/api.php` |
| React 18 SPA source | `resources/js/` |
| SPA shell (Blade) | `resources/views/app.blade.php` |
| SPA route | `routes/web.php` (catch-all, excludes `/api`) |
| Build config | `vite.config.js` (laravel-vite-plugin) |
| Build output | `public/build/` (generated, git-ignored) |

Live at https://g3.mehedihasan.au. Your local copy must stay structurally
identical to it.

## Local setup (XAMPP)

You have PHP, MySQL and a shell locally. Use them freely — the restrictions
below apply to the **server**, not your machine.

```sh
composer install
npm install
cp .env.example .env
php artisan key:generate
# create the database in phpMyAdmin, set DB_* in .env, then:
php artisan migrate --seed
npm run dev          # Vite dev server, hot reload
php artisan serve    # or point XAMPP's vhost at public/
```

`npm run dev` and `php artisan serve` must both be running. The Blade shell
loads assets through `@vite`, which talks to the dev server.

## The one thing that breaks production every time

`resources/js/services/api.js` reads:

```js
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
```

Vite **bakes this into the bundle at build time**. A production build made with
the wrong value ships a bundle that calls the developer's own laptop, so every
API request fails for every user with no server-side error to find.

- Local `.env`: `VITE_API_URL=http://127.0.0.1:8000/api` is fine.
- Any build destined for the server: **`VITE_API_URL=/api`**.

A relative `/api` is correct because the SPA and API share an origin. It also
avoids a CORS preflight. Never hardcode `https://g3.mehedihasan.au/api`.

After building, verify before you upload:

```sh
grep -c "127.0.0.1:8000" public/build/assets/*.js   # must print 0
```

## Deployment constraints — read before proposing any change

The team has **SFTP and phpMyAdmin only**. There is no shell on the server. You
cannot run anything there, and neither can they.

**If a change you make requires any of the following, say so explicitly and
loudly in your response.** Do not write code that silently depends on a command
nobody can run.

| Change you make | What it needs on the server | Who runs it |
|---|---|---|
| Added a package to `composer.json` | `composer install` | Instructor |
| Wrote a migration | `php artisan migrate` | Instructor |
| Changed seeders | `php artisan db:seed` | Instructor |
| Changed `config/` or `bootstrap/app.php` | `php artisan optimize:clear` | Instructor |
| Changed any frontend code | `npm run build`, then upload `public/build/` | Team, locally |

The frontend is the one thing the team can deploy alone: build locally with
`VITE_API_URL=/api`, then SFTP `public/build/` up. No server-side Node needed.

### Files that are server-managed — never overwrite them by SFTP

- **`.env`** — holds the production database credentials. Yours would break the
  live site instantly. It is git-ignored for this reason.
- `vendor/`, `storage/`, `bootstrap/cache/`, `public/index.php`.

## API contract

Base URL `/api`. Auth is Sanctum bearer tokens, stored in `localStorage` under
`sgh_token`. Send `Authorization: Bearer <token>` and
`Accept: application/json` on every authenticated request.

`POST /api/auth/login` takes `{ login, password }` where `login` is **either**
the email or the username. It returns one of three shapes, and the UI must
handle all three:

```
{ data: {...user...}, token: "1|abc..." }                     normal success
{ data: {...}, token: "...", mfa_setup_required: true }       privileged user
                                                              must enrol in MFA
{ mfa_required: true, challenge: "..." }                      MFA already on,
                                                              no token yet
```

A wrong password returns 422. An expired or absent token returns 401.

Sessions carry a 10-minute idle timeout enforced by `EnsureSessionIsActive`,
refreshed on each request. A user idle longer than that gets 401 and must log
in again. This is deliberate; do not "fix" it.

Other endpoints worth knowing: `GET /api/health` and
`GET /api/public/branches` are unauthenticated; `GET /api/auth/me`,
`POST /api/auth/logout`, `POST /api/auth/mfa/verify`.

**Read `routes/api.php` before inventing an endpoint.** There are ~112 routes
already. Do not guess URLs.

### Roles

Exactly eight, spelled as stored: `Admin`, `Branch Manager`, `Doctor`, `Nurse`,
`Receptionist`, `Patient`, `Lab Technician`, `Pharmacist`. They arrive on the
user object under `roles`. Navigation and permissions key off these.

Route middleware aliases available: `role:`, `audit`, `active.session`,
`mfa.setup`, registered in `bootstrap/app.php`.

### Demo accounts

Seeded by `database/seeders/`. All share the password `Password123!`.
Examples: `admin@stgeorge.test`, `manager.NSW@stgeorge.test`,
`nurse.NSW@stgeorge.test`. Synthetic data only, per SRS 2.4 — never put real
patient, clinical or payment data in seeders.

## Working agreements

- Match the existing structure. Services in `resources/js/services/` wrap
  `api.js`; never call `fetch()` directly from a component.
- Backend business logic belongs in `app/Services/`, not in controllers.
- Do not add a router library. The app navigates by React state on purpose, and
  the server-side catch-all assumes it.
- Do not commit `.env`, `vendor/`, `node_modules/` or `public/build/`.
- Keep `composer.json` on Laravel 13. The server runs 13.29; an older pin will
  break `composer install` there.

## When you are unsure

Say what you are unsure about rather than guessing at server behaviour. The
common failure mode on this project has been confident assumptions about the
deployment that turned out to be wrong. If a problem might be server-side, ask
the team to check with their instructor before spending time debugging locally.
