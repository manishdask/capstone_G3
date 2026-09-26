import React, { useEffect } from "react";
import { Cross, ArrowLeft, AlertTriangle } from "lucide-react";

/**
 * Shared shell for the standalone "Site information" pages (privacy policy,
 * accessibility, right to information, copyright and disclaimer). Each is
 * served at its own path by AppRoot — see SITE_INFO_PAGES there.
 */
export function InfoPageLayout({ title, subtitle, docTitle, children }) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${docTitle || title} · St George Hospital Management System`;
    // A deep link such as /privacy-policy#your-rights arrives before React has
    // rendered the sections, so the browser's own jump finds nothing — do it now.
    const target = window.location.hash && document.getElementById(window.location.hash.slice(1));
    if (target) target.scrollIntoView();
    return () => { document.title = previous; };
  }, [title, docTitle]);

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
        .pp-h3 { font-size: 15px; font-weight: 700; margin: 16px 0 6px; }
        .pp-part { font-size: 12px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: var(--ink-mid); margin: 28px 0 10px; }
        .pp-section { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 22px 22px 16px; margin-bottom: 14px; scroll-margin-top: 80px; }
        .pp-section p, .pp-section li { font-size: 14px; line-height: 1.65; color: var(--ink-deep); }
        .pp-section p { margin: 0 0 12px; }
        .pp-section ul, .pp-section ol { margin: 0 0 12px; padding-left: 20px; }
        .pp-section li { margin-bottom: 6px; }
        .pp-muted { color: var(--muted) !important; }
        .pp-warning { background: var(--tint-amber); border: 1px solid var(--line-amber); display: flex; gap: 10px; border-radius: 12px; padding: 12px 14px; margin-bottom: 12px; }
        .pp-toc { columns: 2; column-gap: 24px; margin: 0; padding-left: 18px; }
        .pp-toc li { font-size: 13.5px; margin-bottom: 6px; break-inside: avoid; }
        .pp-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }
        .pp-table th, .pp-table td { text-align: left; vertical-align: top; padding: 8px 10px; border-top: 1px solid var(--line); line-height: 1.5; }
        .pp-table th { font-weight: 700; background: var(--mist); }
        .pp-table-wrap { overflow-x: auto; }
        .pp-contact { background: var(--mist); border-radius: 12px; padding: 12px 14px; margin-bottom: 12px; font-size: 14px; line-height: 1.6; }
        code.pp-code { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 12.5px; background: var(--mist); padding: 1px 5px; border-radius: 4px; }
        .pp-related { display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: 13px; }
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
        <h1 className="f-display pp-h1">{title}</h1>
        {subtitle && <p className="pp-muted" style={{ fontSize: 13, margin: "0 0 22px" }}>{subtitle}</p>}
        {children}

        <nav aria-label="Site information" className="pp-section">
          <h2 className="f-display pp-h2">Site information</h2>
          <div className="pp-related">
            {SITE_INFO_LINKS.map(([href, label]) => (
              <a key={href} className="pp-link" href={href} aria-current={window.location.pathname === href ? "page" : undefined}>{label}</a>
            ))}
          </div>
        </nav>
      </main>
    </div>
  );
}

// Also used by the public site footer.
export const SITE_INFO_LINKS = [
  ["/accessibility", "Accessibility"],
  ["/privacy-policy", "Privacy policy"],
  ["/right-to-information", "Right to information"],
  ["/copyright-and-disclaimer", "Copyright and disclaimer"],
];

export function Section({ id, title, children }) {
  return (
    <section id={id} className="pp-section">
      <h2 className="f-display pp-h2">{title}</h2>
      {children}
    </section>
  );
}

/** The CPRO306 student-project notice every site-information page opens with. */
export function StudentProjectNotice({ children }) {
  return (
    <div className="pp-warning" role="note">
      <AlertTriangle size={18} color="var(--amber-deep)" style={{ flexShrink: 0, marginTop: 2 }} />
      <p style={{ margin: 0, fontWeight: 600 }}>
        {children || "This is a CPRO306 student project, not a real hospital. Do not enter real personal, medical or payment information."}
      </p>
    </div>
  );
}

export function Contents({ sections }) {
  return (
    <nav className="pp-section" aria-label="Contents">
      <h2 className="f-display pp-h2">Contents</h2>
      <ol className="pp-toc">
        {sections.map(([id, label]) => (
          <li key={id}><a className="pp-link" href={`#${id}`}>{label}</a></li>
        ))}
      </ol>
    </nav>
  );
}
