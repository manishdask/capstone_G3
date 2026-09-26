import React, { useEffect } from "react";
import { Cross, ArrowLeft, AlertTriangle } from "lucide-react";

// Served at /privacy-policy. Every statement below was checked against the
// code that implements it — keep them in step. The file references in the
// comments say where to look before changing a sentence.
const LAST_UPDATED = "26 September 2026";
// Must match Consent::CURRENT_NOTICE_VERSION (app/Models/Consent.php) — it is
// the version stamped on every consent a patient gives.
const NOTICE_VERSION = "2026-08-1";

const SECTIONS = [
  ["student-project", "This is a student project"],
  ["summary", "The short version"],
  ["what-we-collect", "What the system stores"],
  ["how-we-use-it", "How it is used"],
  ["who-can-see-it", "Who can see your records"],
  ["protection", "How your data is protected"],
  ["audit-log", "The audit log"],
  ["emergency-access", "Emergency (break-glass) access"],
  ["consent", "Your consent choices"],
  ["your-rights", "Your data rights"],
  ["payments", "Payments"],
  ["third-parties", "Other services we use"],
  ["backups", "Backups and recovery"],
  ["your-browser", "What is stored in your browser"],
  ["retention", "How long data is kept"],
  ["contact", "Questions"],
];

function Section({ id, title, children }) {
  return (
    <section id={id} className="pp-section">
      <h2 className="f-display pp-h2">{title}</h2>
      {children}
    </section>
  );
}

export default function PrivacyPolicy() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Privacy Policy · St George Hospital Management System";
    // A deep link such as /privacy-policy#your-rights arrives before React has
    // rendered the sections, so the browser's own jump finds nothing — do it now.
    const target = window.location.hash && document.getElementById(window.location.hash.slice(1));
    if (target) target.scrollIntoView();
    return () => { document.title = previous; };
  }, []);

  return (
    <div className="f-body pp-root">
      <style>{`
        .pp-root { background: var(--mist); min-height: 100vh; color: var(--ink-deep); }
        .pp-bar { position: sticky; top: 0; z-index: 10; background: rgba(245,246,242,.94); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); }
        .pp-bar-inner { max-width: 820px; margin: 0 auto; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .pp-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--ink-deep); font-weight: 700; font-size: 15px; }
        .pp-link { color: var(--ink); font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
        .pp-link:hover { color: var(--ink-mid); }
        .pp-back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--ink); text-decoration: none; padding: 8px 12px; border: 1px solid var(--line); border-radius: 999px; background: #fff; }
        .pp-back:hover { border-color: var(--ink); }
        .pp-root a:focus-visible, .pp-root button:focus-visible { outline: 2px solid var(--amber-deep); outline-offset: 2px; border-radius: 4px; }
        .pp-main { max-width: 820px; margin: 0 auto; padding: 36px 20px 64px; }
        .pp-h1 { font-size: clamp(26px, 7vw, 36px); margin: 0 0 6px; font-weight: 700; }
        .pp-h2 { font-size: 19px; font-weight: 700; margin: 0 0 10px; }
        .pp-section { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 22px 22px 16px; margin-bottom: 14px; scroll-margin-top: 80px; }
        .pp-section p, .pp-section li { font-size: 14px; line-height: 1.65; color: var(--ink-deep); }
        .pp-section p { margin: 0 0 12px; }
        .pp-section ul { margin: 0 0 12px; padding-left: 20px; }
        .pp-section li { margin-bottom: 6px; }
        .pp-muted { color: var(--muted) !important; }
        .pp-warning { background: var(--tint-amber); border: 1px solid var(--line-amber); }
        .pp-toc { columns: 2; column-gap: 24px; margin: 0; padding-left: 18px; }
        .pp-toc li { font-size: 13.5px; margin-bottom: 6px; break-inside: avoid; }
        .pp-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }
        .pp-table th, .pp-table td { text-align: left; vertical-align: top; padding: 8px 10px; border-top: 1px solid var(--line); line-height: 1.5; }
        .pp-table th { font-weight: 700; background: var(--mist); }
        .pp-table-wrap { overflow-x: auto; }
        code.pp-code { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 12.5px; background: var(--mist); padding: 1px 5px; border-radius: 4px; }
        @media (max-width: 560px) {
          .pp-toc { columns: 1; }
          .pp-section { padding: 18px 16px 10px; }
          .pp-main { padding: 26px 14px 48px; }
        }
      `}</style>

      <header className="pp-bar">
        <div className="pp-bar-inner">
          <a href="/" className="pp-brand">
            <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Cross size={16} color="#fff" />
            </span>
            St George Hospital
          </a>
          <a href="/" className="pp-back"><ArrowLeft size={14} /> Back to the website</a>
        </div>
      </header>

      <main className="pp-main">
        <h1 className="f-display pp-h1">Privacy Policy</h1>
        <p className="pp-muted" style={{ fontSize: 13, margin: "0 0 22px" }}>
          Last updated {LAST_UPDATED} · Privacy notice version <code className="pp-code">{NOTICE_VERSION}</code>
        </p>

        <Section id="student-project" title="This is a student project">
          <div className="pp-warning" style={{ display: "flex", gap: 10, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
            <AlertTriangle size={18} color="var(--amber-deep)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>
              Do not enter real personal, medical or payment information anywhere in this system.
            </p>
          </div>
          <p>
            The St George Hospital Management System is a capstone project built by Group 3 for the unit CPRO306.
            It is <strong>not a real hospital</strong> and does not provide medical care. The patients, doctors,
            appointments, test results and invoices you see are made-up demonstration data.
          </p>
          <p>
            Payments run in <strong>test mode</strong> only — no real money ever moves, and only Stripe's published
            test card numbers (such as 4242 4242 4242 4242) will work.
          </p>
          <p>
            This policy still describes exactly what the software does with information, so that it can be reviewed
            as if it were running for real.
          </p>
        </Section>

        <nav className="pp-section" aria-label="Contents">
          <h2 className="f-display pp-h2">Contents</h2>
          <ol className="pp-toc">
            {SECTIONS.map(([id, label]) => (
              <li key={id}><a className="pp-link" href={`#${id}`}>{label}</a></li>
            ))}
          </ol>
        </nav>

        <Section id="summary" title="The short version">
          <ul>
            <li>We store the information needed to run your care: your details, appointments, medical notes, prescriptions, lab results and bills.</li>
            <li>Staff only see the records their job needs. Your doctor sees their own patients; branch staff see their own branch.</li>
            <li>Every change made to a record is written to an audit log, recording who made it and when.</li>
            <li>The most sensitive fields — allergies, diagnoses, treatment notes and lab results — are encrypted in the database.</li>
            <li>You can ask for a copy of your data or for mistakes to be corrected, and you can grant or withdraw consent at any time.</li>
            <li>Card payments are handled by Stripe. We never see or store your full card number.</li>
          </ul>
        </Section>

        {/* Patient.php $fillable, MedicalRecord, Prescription, LabOrder/LabResult,
            Appointment, Invoice/Payment, Feedback, Consent, DataRequest, AuditLog, User */}
        <Section id="what-we-collect" title="What the system stores">
          <div className="pp-table-wrap">
            <table className="pp-table">
              <thead>
                <tr><th scope="col">Kind of information</th><th scope="col">What it includes</th></tr>
              </thead>
              <tbody>
                <tr><td>Your account</td><td>Name, email address, username and password. Passwords are stored only as a one-way hash, so nobody — including administrators — can read them.</td></tr>
                <tr><td>Your patient profile</td><td>Patient ID, first and last name, date of birth, gender, phone number, email, address, allergies, emergency contact name and phone, and your home branch.</td></tr>
                <tr><td>Medical records</td><td>Notes written by doctors and nurses, including diagnoses, treatment notes and vital signs recorded on the ward.</td></tr>
                <tr><td>Prescriptions</td><td>The medicines, doses and frequencies prescribed to you, and whether they have been dispensed.</td></tr>
                <tr><td>Lab tests</td><td>Tests requested for you, their status, the results, and any report file the lab attaches.</td></tr>
                <tr><td>Appointments</td><td>Your bookings, the doctor and branch, the reason you gave, and status changes such as cancellations (with the reason recorded).</td></tr>
                <tr><td>Billing and payments</td><td>Invoices and their line items, and for each payment the Stripe reference, amount, currency, status, date paid, and — if a card was declined — the reason Stripe gave.</td></tr>
                <tr><td>Feedback</td><td>Star ratings and comments you choose to leave about your visit or doctor.</td></tr>
                <tr><td>Notifications</td><td>Messages the system sends you, such as booking confirmations, and whether each was delivered.</td></tr>
                <tr><td>Consent and data requests</td><td>The consent choices you make and any access or correction requests you submit (see below).</td></tr>
                <tr><td>Security records</td><td>The audit log of changes (including the IP address they came from), and, for accounts using multi-factor authentication, the secret and recovery codes it uses.</td></tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="how-we-use-it" title="How it is used">
          <p>Only to run the hospital's services:</p>
          <ul>
            <li>booking and managing your appointments, and letting the right doctor see them;</li>
            <li>recording your care — notes, vital signs, prescriptions and lab tests;</li>
            <li>producing your invoices and taking payment;</li>
            <li>sending you notices about your bookings, results and bills;</li>
            <li>spotting possible duplicate patient records so they can be reviewed — nothing is ever merged automatically; a staff member decides;</li>
            <li>producing branch reports for managers; and</li>
            <li>keeping the system secure and accountable.</li>
          </ul>
          <p>Marketing messages are only something you can opt in to — see <a className="pp-link" href="#consent">your consent choices</a>.</p>
        </Section>

        {/* app/Services/ClinicalAccess.php */}
        <Section id="who-can-see-it" title="Who can see your records">
          <p>Access depends on each person's role, and is decided on the server from their own account — changing a number in a web address cannot widen it.</p>
          <ul>
            <li><strong>You</strong> can see your own records and nobody else's.</li>
            <li><strong>Doctors</strong> can open the files of patients assigned to them — patients who have an appointment with them or whose notes they have written — and the appointments booked with them.</li>
            <li><strong>Nurses, receptionists and branch managers</strong> can see patients at their own branch.</li>
            <li><strong>Lab technicians and pharmacists</strong> cannot browse patient files. They work only from the lab order or prescription in front of them, which carries the details they need.</li>
            <li><strong>Administrators</strong> can see across all branches, to run and support the system.</li>
          </ul>
          <p>The only way outside these rules is <a className="pp-link" href="#emergency-access">emergency access</a>, which is itself recorded and reviewed.</p>
        </Section>

        <Section id="protection" title="How your data is protected">
          <ul>
            <li><strong>Encrypted connection.</strong> The site is served over HTTPS, so information is encrypted between your device and our server.</li>
            <li><strong>Encryption in the database.</strong> Allergies, diagnoses, treatment notes, the content of medical records, lab results, and multi-factor secrets are encrypted before being saved. Other fields, such as your name and contact details, are protected by the access rules above rather than by encryption.</li>
            {/* MfaController / RequireMfaSetup / User::requiresMfa(). Mandatory MFA is
                currently switched off for testing (requiresMfa() returns false) —
                see the note in FR_PROGRESS.md; it must be re-enabled before submission. */}
            <li><strong>Multi-factor authentication (MFA).</strong> The system is designed to require MFA for administrator and branch-manager accounts, which can see the most information. With MFA on, signing in needs a six-digit code from an authenticator app as well as the password, and eight one-time recovery codes are issued in case the phone is lost. Patient accounts sign in with a password.</li>
            <li><strong>Automatic sign-out.</strong> If you are inactive for 10 minutes, your session ends and you must sign in again.</li>
            <li><strong>Accountability.</strong> Changes to records are logged — see <a className="pp-link" href="#audit-log">the audit log</a>.</li>
          </ul>
        </Section>

        {/* app/Http/Middleware/AuditMiddleware.php — writes only; reads are not logged */}
        <Section id="audit-log" title="The audit log">
          <p>Whenever anyone creates, changes or deletes information — booking an appointment, writing a note, recording a payment, granting consent and so on — the system records:</p>
          <ul>
            <li>who did it and what their role was;</li>
            <li>what they did and which record it affected;</li>
            <li>whether it succeeded;</li>
            <li>the time and the IP address it came from.</li>
          </ul>
          <p>
            Some events are also recorded specifically: every emergency access grant, every use of the virtual assistant,
            billing events, and failed backups.
          </p>
          <p>
            Simply <strong>viewing</strong> a record is not logged for every view. Viewing becomes a logged event when it
            happens through emergency access.
          </p>
          <p>Only administrators can read the audit log. They can filter it and export it for review.</p>
        </Section>

        {/* app/Http/Controllers/Api/BreakGlassController.php */}
        <Section id="emergency-access" title="Emergency (break-glass) access">
          <p>
            In a genuine emergency, a staff member may need a patient's record that they would not normally be allowed to
            open. They can request "break-glass" access, and the system makes that deliberate and visible:
          </p>
          <ul>
            <li>they must write down the reason before access is granted;</li>
            <li>access lasts <strong>30 minutes</strong> and then expires on its own — it can also be ended early;</li>
            <li>the grant is written to the audit log straight away as an emergency access event;</li>
            <li>every grant goes into a queue for an administrator to review afterwards and record their findings.</li>
          </ul>
        </Section>

        {/* app/Http/Controllers/Api/ConsentController.php, AuthController register */}
        <Section id="consent" title="Your consent choices">
          <p>There are currently two things you can give or withhold consent for:</p>
          <ul>
            <li><strong>Privacy notice and treatment</strong> — agreeing to this notice and to your information being used for your care. This is recorded automatically when you register.</li>
            <li><strong>Marketing communications</strong> — optional, and off unless you turn it on.</li>
          </ul>
          <p>
            You can grant or withdraw either one at any time from <strong>Profile → Privacy &amp; Consent</strong> in the
            patient app. Each consent is stamped with the version of this notice it was given under
            (currently <code className="pp-code">{NOTICE_VERSION}</code>).
          </p>
          <p>
            Withdrawing adds a new "withdrawn" entry. It does not erase the record of when you originally agreed, so there
            is always an accurate history of your choices.
          </p>
          <p className="pp-muted">
            In this version of the system, withdrawing consent is recorded for staff to act on; it does not by itself
            switch off any feature automatically.
          </p>
        </Section>

        {/* app/Http/Controllers/Api/DataRequestController.php — types: access, correction */}
        <Section id="your-rights" title="Your data rights">
          <p>From <strong>Profile → My Data Requests</strong> you can ask for:</p>
          <ul>
            <li><strong>Access</strong> — a copy of the information held about you; or</li>
            <li><strong>Correction</strong> — for information that is wrong to be fixed.</li>
          </ul>
          <p>What happens next:</p>
          <ol style={{ margin: "0 0 12px", paddingLeft: 20 }}>
            <li>A staff member picks up the request and <strong>confirms your identity</strong>. No decision can be recorded until they have.</li>
            <li>An administrator or branch manager approves or declines it and writes down why.</li>
            <li>You can follow each request's status — pending, in review, approved or rejected — in the app.</li>
          </ol>
          <p>
            <strong>Deletion requests are not currently supported</strong> through the app. Medical records are kept as
            a permanent history of care, so the system does not offer a way to erase them.
          </p>
        </Section>

        {/* InvoicePaymentService, PaymentGatewayService, StripeCheckoutModal */}
        <Section id="payments" title="Payments">
          <p>
            When you pay an invoice online, you type your card details into a form provided by <strong>Stripe</strong>,
            a payment company. The card number goes directly from your browser to Stripe — it never passes through
            or is stored on our servers.
          </p>
          <p>
            What we keep is Stripe's reference for the payment, the amount and currency (Australian dollars), whether it
            succeeded, when it was paid, and the reason if your card was declined. The amount you are charged is always
            worked out by our server from your invoice, never taken from your browser.
          </p>
          <p className="pp-muted">
            In this project Stripe runs in test mode. If Stripe is not configured, the system uses a built-in simulator
            instead, which takes no card details at all.
          </p>
        </Section>

        <Section id="third-parties" title="Other services we use">
          <div className="pp-table-wrap">
            <table className="pp-table">
              <thead>
                <tr><th scope="col">Service</th><th scope="col">What it receives</th></tr>
              </thead>
              <tbody>
                <tr><td>Stripe</td><td>Your card details (entered into Stripe's own form) and the payment amount, when you pay online.</td></tr>
                <tr>
                  <td>OpenRouter (virtual assistant)</td>
                  <td>
                    The text of questions you type into the chat assistant — but only general questions about bookings, test
                    status, opening hours or contacts. Anything that sounds medical or urgent is <strong>not sent</strong>;
                    you are directed to a human instead. The assistant does not receive your name or records, and the
                    conversation is not saved — only the fact that a chat happened is logged.
                  </td>
                </tr>
                <tr><td>Email and SMS providers</td><td>Your email address or phone number and the text of the notice, when the system sends you a booking, result or billing message.</td></tr>
                <tr><td>Google Fonts</td><td>Your browser downloads the site's fonts from Google, which, like any website, can see your IP address.</td></tr>
              </tbody>
            </table>
          </div>
          <p>We do not sell information or share it with advertisers.</p>
        </Section>

        {/* app/Services/BackupService.php, routes/console.php */}
        <Section id="backups" title="Backups and recovery">
          <ul>
            <li>A full backup of the database is scheduled to run every day at 2:00 am, and administrators can also start one by hand.</li>
            <li>Each backup is checked to make sure it is complete, then <strong>encrypted</strong> before it is saved. A failed backup is recorded in the audit log.</li>
            <li>Administrators run <strong>restore drills</strong>: the system decrypts a backup and checks it contains everything needed to rebuild the database. Drills never touch the live system.</li>
          </ul>
          <p className="pp-muted">Backups are currently stored on the same server as the application.</p>
        </Section>

        <Section id="your-browser" title="What is stored in your browser">
          <p>
            To keep you signed in when you reload the page, the app saves your session token, a copy of your basic profile,
            and which screen you last had open, in your browser's local storage. These are cleared when you log out.
          </p>
          <p>
            The app can be installed on your device, and it keeps copies of its own program files so it loads quickly.
            It never stores your records or any other personal data in that cache.
          </p>
          <p>
            On a shared or public computer, always use <strong>Log out</strong> when you finish. There are no advertising or
            tracking cookies.
          </p>
        </Section>

        <Section id="retention" title="How long data is kept">
          <p>
            The system does not automatically delete records. Medical records, bills, consent history and the audit log are
            kept as a permanent history. Because this is a student project, the demonstration database may be reset and
            reloaded with fresh made-up data at any time.
          </p>
        </Section>

        <Section id="contact" title="Questions">
          <p>
            This system was built by CPRO306 Group 3 as a capstone project. If you have a question about this policy or the
            project, please contact the team through your CPRO306 course channels.
          </p>
          <p>
            <a className="pp-link" href="/">Return to the St George Hospital website</a>
          </p>
        </Section>
      </main>
    </div>
  );
}
