import React from "react";
import { InfoPageLayout, Section, StudentProjectNotice, Contents } from "./InfoPageLayout.jsx";

// Served at /privacy-policy. Structure follows the NSW public health privacy
// statement model (website use → patient information → law → complaints →
// changes), but every statement is checked against the code that implements
// it — the file references in the comments say where to look before changing
// a sentence. Keep them in step.
const LAST_UPDATED = "26 September 2026";
// Must match Consent::CURRENT_NOTICE_VERSION (app/Models/Consent.php) — it is
// the version stamped on every consent a patient gives.
const NOTICE_VERSION = "2026-08-1";

const SECTIONS = [
  ["student-project", "This is a student project"],
  ["summary", "The short version"],
  ["website", "Visiting this website"],
  ["cookies", "Cookies and your browser"],
  ["what-we-collect", "What the system stores about patients"],
  ["how-we-use-it", "How it is used"],
  ["who-can-see-it", "Who can see your records"],
  ["protection", "How your data is protected"],
  ["audit-log", "The audit log"],
  ["emergency-access", "Emergency (break-glass) access"],
  ["consent", "Your consent choices"],
  ["your-rights", "Your data rights"],
  ["feedback", "Feedback you give us"],
  ["payments", "Payments"],
  ["third-parties", "Other services we use"],
  ["backups", "Backups and recovery"],
  ["retention", "How long data is kept"],
  ["law", "Privacy law and principles"],
  ["complaints", "Questions and complaints"],
  ["changes", "Changes to this policy"],
];

export default function PrivacyPolicy() {
  return (
    <InfoPageLayout
      title="Privacy policy"
      docTitle="Privacy Policy"
      subtitle={<>Last updated {LAST_UPDATED} · Privacy notice version <code className="pp-code">{NOTICE_VERSION}</code></>}
    >
      <Section id="student-project" title="This is a student project">
        <StudentProjectNotice />
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

      <Contents sections={SECTIONS} />

      <Section id="summary" title="The short version">
        <ul>
          <li>We store the information needed to run your care: your details, appointments, medical notes, prescriptions, lab results and bills.</li>
          <li>Staff only see the records their job needs. Your doctor sees their own patients; branch staff see their own branch.</li>
          <li>Every change made to a record is written to an audit log, recording who made it and when.</li>
          <li>The most sensitive fields — allergies, diagnoses, treatment notes and lab results — are encrypted in the database.</li>
          <li>You can ask for a copy of your data or for mistakes to be corrected, and you can grant or withdraw consent at any time.</li>
          <li>Card payments are handled by Stripe. We never see or store your full card number.</li>
          <li>The website uses no analytics, advertising or tracking cookies.</li>
        </ul>
      </Section>

      <div className="pp-part">Part 1 — Using this website</div>

      {/* config/session.php: driver=database, lifetime 120 min. Laravel's database
          session handler records ip_address and user_agent with each session. */}
      <Section id="website" title="Visiting this website">
        <p>When you open any page of this website, even without signing in, the server keeps a short-lived session record so the site works correctly. It contains:</p>
        <ul>
          <li>your IP address;</li>
          <li>your browser and operating system, as your browser reports them;</li>
          <li>the time of your last request.</li>
        </ul>
        <p>
          It is used only to keep your visit working and secure. It is not used to build a profile of you, is not
          combined with other data, and is not shared. The session expires after <strong>2 hours</strong> of inactivity.
        </p>
        <p className="pp-muted">
          Like almost every website, the hosting company's web server may also keep its own standard access logs
          (addresses, times and pages requested) for running the server.
        </p>
      </Section>

      <Section id="cookies" title="Cookies and your browser">
        <p>The website sets two cookies, both essential for it to work, and no others:</p>
        <div className="pp-table-wrap">
          <table className="pp-table">
            <thead>
              <tr><th scope="col">Cookie</th><th scope="col">What it is for</th><th scope="col">How long it lasts</th></tr>
            </thead>
            <tbody>
              <tr><td>Session cookie</td><td>Connects your browser to its session record (above). Scripts cannot read it.</td><td>2 hours</td></tr>
              <tr><td><code className="pp-code">XSRF-TOKEN</code></td><td>A security token that stops other websites sending forged requests on your behalf.</td><td>2 hours</td></tr>
            </tbody>
          </table>
        </div>
        <p>Both are only ever sent over a secure (HTTPS) connection. There are <strong>no analytics, advertising or tracking cookies</strong>.</p>
        <p>
          When you sign in to the patient or staff app, it also saves your sign-in token, a copy of your basic profile,
          and which screen you last had open, in your browser's local storage, so a page reload keeps you signed in.
          These are cleared when you log out. On a shared or public computer, always use <strong>Log out</strong> when
          you finish.
        </p>
        <p>
          The app can be installed on your device. It keeps copies of its own program files so it loads quickly, but it
          never stores your records or any other personal data in that cache.
        </p>
      </Section>

      <div className="pp-part">Part 2 — Your patient information</div>

      {/* Patient.php $fillable, MedicalRecord, Prescription, LabOrder/LabResult,
          Appointment, Invoice/Payment, Feedback, Consent, DataRequest, AuditLog, User */}
      <Section id="what-we-collect" title="What the system stores about patients">
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
              <tr><td>Feedback</td><td>Star ratings and comments you choose to leave (see <a className="pp-link" href="#feedback">feedback</a>).</td></tr>
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
        <p>Marketing messages are only something you can opt in to — see <a className="pp-link" href="#consent">your consent choices</a>. We do not sell information or share it with advertisers.</p>
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
          <li><strong>Automatic sign-out.</strong> If you are inactive for 10 minutes, your session ends and you must sign in again. You are warned a minute beforehand and can choose to stay signed in.</li>
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
        <p>Some events are also recorded specifically: every emergency access grant, every use of the virtual assistant, billing events, and failed backups.</p>
        <p>Simply <strong>viewing</strong> a record is not logged for every view. Viewing becomes a logged event when it happens through emergency access.</p>
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
        <p>Withdrawing adds a new "withdrawn" entry. It does not erase the record of when you originally agreed, so there is always an accurate history of your choices.</p>
        <p className="pp-muted">In this version of the system, withdrawing consent is recorded for staff to act on; it does not by itself switch off any feature automatically.</p>
      </Section>

      {/* app/Http/Controllers/Api/DataRequestController.php — types: access, correction */}
      <Section id="your-rights" title="Your data rights">
        <p>From <strong>Profile → My Data Requests</strong> you can ask for:</p>
        <ul>
          <li><strong>Access</strong> — a copy of the information held about you; or</li>
          <li><strong>Correction</strong> — for information that is wrong to be fixed.</li>
        </ul>
        <p>What happens next:</p>
        <ol>
          <li>A staff member picks up the request and <strong>confirms your identity</strong>. No decision can be recorded until they have.</li>
          <li>An administrator or branch manager approves or declines it and writes down why.</li>
          <li>You can follow each request's status — pending, in review, approved or rejected — in the app.</li>
        </ol>
        <p>
          <strong>Deletion requests are not currently supported</strong> through the app. Medical records are kept as a
          permanent history of care, so the system does not offer a way to erase them.
        </p>
        <p>See also <a className="pp-link" href="/right-to-information">Right to information</a> for what you can already see in the app yourself.</p>
      </Section>

      {/* app/Http/Controllers/Api/FeedbackController.php — GET /feedback: Admin, Branch Manager */}
      <Section id="feedback" title="Feedback you give us">
        <ul>
          <li>Leaving feedback is always optional.</li>
          <li>Your star rating and comment are saved with your patient record, your branch and — if you chose one — the doctor it is about.</li>
          <li>Only administrators and branch managers can read feedback. It is used to improve services and is <strong>not published</strong> on this website.</li>
          <li>Your comment is stored exactly as you wrote it. No automated analysis is run on it, and giving feedback does not sign you up for any mailing list.</li>
        </ul>
      </Section>

      {/* InvoicePaymentService, PaymentGatewayService, StripeCheckoutModal */}
      <Section id="payments" title="Payments">
        <p>
          When you pay an invoice online, you type your card details into a form provided by <strong>Stripe</strong>, a
          payment company. The card number goes directly from your browser to Stripe — it never passes through or is
          stored on our servers.
        </p>
        <p>
          What we keep is Stripe's reference for the payment, the amount and currency (Australian dollars), whether it
          succeeded, when it was paid, and the reason if your card was declined. The amount you are charged is always
          worked out by our server from your invoice, never taken from your browser.
        </p>
        <p className="pp-muted">In this project Stripe runs in test mode. If Stripe is not configured, the system uses a built-in simulator instead, which takes no card details at all.</p>
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
        <p>We are not responsible for the privacy practices of other websites this site links to.</p>
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

      <Section id="retention" title="How long data is kept">
        <p>
          The system does not automatically delete patient records. Medical records, bills, consent history and the audit
          log are kept as a permanent history. Website session records expire after 2 hours. Because this is a student
          project, the demonstration database may be reset and reloaded with fresh made-up data at any time.
        </p>
      </Section>

      <Section id="law" title="Privacy law and principles">
        <p>
          In New South Wales, a real public hospital must handle health information under the{" "}
          <em>Health Records and Information Privacy Act 2002</em> (NSW), which sets out 15 Health Privacy Principles,
          and other personal information under the <em>Privacy and Personal Information Protection Act 1998</em> (NSW).
        </p>
        <p>
          This project is not a health service, so those Acts do not apply to it. Its design follows the same ideas,
          though, and this policy explains how: telling you what is collected and why, limiting who can see it, keeping
          it secure, letting you see and correct it, and keeping a record of who changes it.
        </p>
      </Section>

      <Section id="complaints" title="Questions and complaints">
        <p>For anything about this project or this policy, contact the team that built it:</p>
        <div className="pp-contact">
          <strong>CPRO306 Group 3 — project team</strong><br />
          Through your CPRO306 course channels.
        </div>
        <p>
          If you ever have a concern about how a <strong>real</strong> NSW health service handled your information, the
          usual path is to raise it with that service's privacy officer first. If you are not satisfied, you can contact
          the <strong>Information and Privacy Commission NSW</strong> (ipc.nsw.gov.au, 1800 472 679), which can also
          explain your options for review by the NSW Civil and Administrative Tribunal.
        </p>
      </Section>

      <Section id="changes" title="Changes to this policy">
        <p>
          When this policy changes, its version number and "last updated" date change too. Every consent you give is
          recorded against the version in force at the time, so there is a record of which version you agreed to.
        </p>
        <p className="pp-muted">The system does not currently ask existing patients to re-confirm their consent when the version changes.</p>
      </Section>
    </InfoPageLayout>
  );
}
