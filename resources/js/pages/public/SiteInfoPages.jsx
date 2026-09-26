import React from "react";
import { InfoPageLayout, Section, StudentProjectNotice } from "./InfoPageLayout.jsx";

// The "Site information" pages linked from the public footer, alongside the
// privacy policy. Like the policy, each statement reflects what the code
// actually does — the comments name where to check before changing one.

const UPDATED = "Last updated 26 September 2026";

/** Served at /accessibility */
export function AccessibilityPage() {
  return (
    <InfoPageLayout title="Accessibility" subtitle={UPDATED}>
      <Section id="commitment" title="Our aim">
        <StudentProjectNotice />
        <p>
          We want everyone to be able to use this website and the patient and staff apps, including people who use a
          keyboard instead of a mouse, a screen reader, zoom, or a small screen. We aim to meet the{" "}
          <strong>Web Content Accessibility Guidelines (WCAG) 2.1, level AA</strong>.
        </p>
        <p>
          As a student project, the site has <strong>not had a formal accessibility audit</strong>. This page explains
          what we have done, and where we know it falls short.
        </p>
      </Section>

      <Section id="what-works" title="What we have done">
        <ul>
          <li><strong>Keyboard access.</strong> Links, buttons and form fields can be reached with the Tab key and used with Enter. On the public website and these information pages, the item you are on is shown with a clear outline.</li>
          <li><strong>Labels for icon buttons.</strong> Buttons that show only an icon — such as the notification bell, "close" buttons and the payment dialog — have text labels that screen readers announce.</li>
          <li><strong>Page language.</strong> Every page declares that it is in English, so screen readers pronounce it correctly.</li>
          <li><strong>Headings and landmarks.</strong> Pages use proper headings, and the navigation areas and footer columns are marked so they can be jumped to.</li>
          <li><strong>Small screens and zoom.</strong> Layouts adapt to phones and to browser zoom without text being cut off or needing sideways scrolling.</li>
          {/* components/ui/IdleTimer.jsx: 60-second warning with "Stay Logged In" */}
          <li><strong>Time limits you can extend.</strong> For security you are signed out after 10 minutes of inactivity, but a warning appears one minute beforehand with a button to stay signed in.</li>
          <li><strong>Clear messages.</strong> Errors — for example a declined card — are shown in words, not only by colour.</li>
        </ul>
      </Section>

      <Section id="known-issues" title="Known limitations">
        <ul>
          {/* No focus-trap code in resources/js */}
          <li>Pop-up dialogs, such as the payment window, do not yet keep keyboard focus inside them, so pressing Tab can move behind the dialog.</li>
          {/* No prefers-reduced-motion rules */}
          <li>The site does not yet reduce animations when your device's "reduce motion" setting is on.</li>
          {/* recharts in pages/admin/AdminOverview.jsx, AdminReports.jsx */}
          <li>Charts in the administrator dashboard and reports are visual only; the same figures are not yet offered as a table.</li>
          <li>On a large screen, the patient and staff apps are shown inside a phone-shaped frame, which makes them smaller. Browser zoom enlarges them.</li>
          <li>Colour contrast has not been measured across every screen.</li>
          <li>The card number field in the payment window is provided by Stripe, so its accessibility depends on Stripe.</li>
        </ul>
      </Section>

      <Section id="tips" title="Tips">
        <ul>
          <li>Use your browser's zoom (Ctrl and +, or ⌘ and + on a Mac) to make everything larger.</li>
          <li>Press Tab to move forward and Shift+Tab to move back through links and buttons.</li>
          <li>The site works with the screen reader built into your device, such as VoiceOver, TalkBack or Narrator.</li>
        </ul>
      </Section>

      <Section id="feedback" title="Tell us about a problem">
        <p>If something on this site is hard to use, please let the CPRO306 Group 3 project team know through your course channels, and include the page and what you were trying to do.</p>
      </Section>
    </InfoPageLayout>
  );
}

/** Served at /right-to-information */
export function RightToInformationPage() {
  return (
    <InfoPageLayout title="Right to information" subtitle={UPDATED}>
      <Section id="about" title="About this page">
        <StudentProjectNotice />
        <p>
          In New South Wales, the <em>Government Information (Public Access) Act 2009</em> — the "GIPA Act" — gives the
          public a right to request information held by government agencies, including public hospitals. Your own health
          information is covered separately, under health privacy law.
        </p>
        <p>
          This project is not a government agency, so the GIPA Act does not apply to it, and it has no formal access
          application process or disclosure log. What it does give you is direct access to your own information, as
          described below.
        </p>
      </Section>

      {/* pages/patient/PatientRecords.jsx, PatientAppointments.jsx, PatientProfile.jsx */}
      <Section id="in-the-app" title="What you can see yourself in the patient app">
        <div className="pp-table-wrap">
          <table className="pp-table">
            <thead>
              <tr><th scope="col">Where</th><th scope="col">What you can see or download</th></tr>
            </thead>
            <tbody>
              <tr><td>Records → Medical history</td><td>Your recorded allergies and your prescriptions, with who prescribed them and when.</td></tr>
              <tr><td>Records → Lab reports</td><td>Your lab tests, their status and results, and a download of the report file where the lab attached one.</td></tr>
              <tr><td>Records → Invoices</td><td>Every invoice, a printable PDF of each, and your payment history.</td></tr>
              <tr><td>Appts</td><td>All your appointments and their status, plus reminders for upcoming visits.</td></tr>
              <tr><td>Profile</td><td>Your personal details, your consent choices and your data requests.</td></tr>
              <tr><td>Notification bell</td><td>The messages the system has sent you.</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          Doctors' and nurses' clinical notes (such as diagnoses and treatment notes) are <strong>not</strong> shown in
          the app. To get a copy of them, make an access request.
        </p>
      </Section>

      {/* DataRequestController: types access | correction */}
      <Section id="request" title="Asking for more">
        <p>From <strong>Profile → My Data Requests</strong> you can ask for:</p>
        <ul>
          <li><strong>Access</strong> — a copy of everything held about you, including clinical notes; or</li>
          <li><strong>Correction</strong> — for information that is wrong to be fixed.</li>
        </ul>
        <p>
          Staff confirm your identity before an administrator or branch manager decides the request, and you can track
          its status in the app. The <a className="pp-link" href="/privacy-policy#your-rights">privacy policy</a> explains
          the process in full.
        </p>
      </Section>
    </InfoPageLayout>
  );
}

/** Served at /copyright-and-disclaimer */
export function CopyrightDisclaimerPage() {
  return (
    <InfoPageLayout title="Copyright and disclaimer" subtitle={UPDATED}>
      <Section id="disclaimer" title="Disclaimer">
        <StudentProjectNotice />
        <ul>
          <li>
            This website and its apps are a <strong>student project</strong> for the unit CPRO306, built by Group 3. It is
            not a real health service and is <strong>not affiliated with or endorsed by NSW Health, South Eastern Sydney
            Local Health District, or the real St George Hospital</strong>. Their name is used only as the setting for the
            project.
          </li>
          <li>
            The doctors, staff, patients, services, statistics and opening hours shown are made up for demonstration.
            Addresses and phone numbers on the site may belong to real organisations, so <strong>do not use them</strong>{" "}
            to seek care — contact services through official NSW Health websites instead.
          </li>
          <li>
            <strong>Nothing on this site is medical advice.</strong> In an emergency, call <strong>000</strong>.
          </li>
          <li>
            The virtual assistant gives general, non-medical answers only and can be wrong. Always check anything
            important with a person.
          </li>
          <li>Payments are in Stripe test mode. No real money is charged, and no real card should be used.</li>
          <li>
            The site is provided as-is for education and assessment. We cannot guarantee it is always available, error-free,
            or that data entered into it will be kept.
          </li>
        </ul>
      </Section>

      <Section id="copyright" title="Copyright">
        <p>
          © 2026 CPRO306 Group 3. The project's original code, design and text were created by the team for assessment.
          Please ask the team before reusing them.
        </p>
      </Section>

      {/* package.json, composer.json, resources/views/app.blade.php (fonts) */}
      <Section id="third-party" title="Third-party software and fonts">
        <p>This project is built with open-source software, used under each project's own licence:</p>
        <ul>
          <li>Laravel (MIT licence) — the server application.</li>
          <li>React (MIT licence) — the user interface.</li>
          <li>Lucide icons (ISC licence).</li>
          <li>Recharts (MIT licence) — dashboard charts.</li>
          <li>Dompdf (LGPL licence) — PDF invoices.</li>
          <li>Inter, Space Grotesk and IBM Plex Mono fonts (SIL Open Font Licence), served by Google Fonts.</li>
        </ul>
        <p>Payment processing is provided by Stripe under Stripe's own terms.</p>
      </Section>
    </InfoPageLayout>
  );
}
