import React, { useState, useMemo } from "react";
import InstallButton from "../../components/ui/InstallButton.jsx";
import {
  HeartPulse, Siren, Stethoscope, MapPin, Phone, Car, Train, Wifi, Waves,
  TreePine, Languages, ArrowRight, Search, Users, Building2, ShieldCheck,
  Calendar, Activity, Cross, Bone, Brain, FlaskConical, Pill, Baby, Menu, X,
} from "lucide-react";

// ============================================================================
// CONTENT — edit freely, this is all static demo copy
// ============================================================================

const SERVICES = [
  { icon: HeartPulse, title: "Cardiology & Cardiothoracic Surgery", desc: "State-of-the-art cardiac catheterization labs, coronary care units, pacemaker implantation, and complex heart valve surgeries.", tags: ["Open Heart Unit", "Echocardiography", "24/7 STEMI Protocol"], keywords: "cardiology heart cardiac surgery vascular" },
  { icon: Siren, title: "Emergency Medicine & Level 1 Trauma", desc: "Designated major adult trauma referral centre with advanced resuscitation bays, dedicated trauma teams, and rapid surgical access.", tags: ["24/7 Fast Triage", "Helipad Access", "Major Trauma Team"], keywords: "emergency trauma resuscitation critical care triage" },
  { icon: ShieldCheck, title: "Oncology & Clinical Hematology", desc: "Holistic cancer care spanning medical oncology, targeted chemotherapy infusions, radiation oncology, and clinical trials.", tags: ["Infusion Suites", "Clinical Trials", "Multidisciplinary Care"], keywords: "oncology cancer chemotherapy radiation haematology" },
  { icon: Bone, title: "Orthopedics & Musculoskeletal Rehab", desc: "Robotic joint replacement surgery, spinal trauma reconstruction, pediatric orthopedic clinics, and dedicated physiotherapy wards.", tags: ["Joint Replacement", "Sports Surgery", "Fast-Track Rehab"], keywords: "orthopedics joint replacement sports bone fracture" },
  { icon: Baby, title: "Maternity & Women's Health", desc: "Modern birthing suites, maternal-fetal medicine clinics, special care nursery, and comprehensive post-natal support.", tags: ["Private Birthing Suites", "Neonatal Special Care", "Prenatal Education"], keywords: "maternity obstetrics gynaecology birth pregnancy newborn" },
  { icon: Brain, title: "Neurology & Neurosurgery", desc: "Acute stroke unit with endovascular thrombectomy, video EEG epilepsy monitoring, and brain tumor microsurgery.", tags: ["Rapid Stroke Unit", "Epilepsy Monitoring", "Stereotactic Surgery"], keywords: "neurology neurosurgery stroke brain epilepsy spine" },
  { icon: FlaskConical, title: "Diagnostic Pathology & Laboratory", desc: "NATA-accredited 24-hour pathology laboratory covering hematology, clinical biochemistry, microbiology, and molecular genetics.", tags: ["NATA Accredited", "Digital Results Sync", "Rapid Blood Bank"], keywords: "pathology laboratory blood tests biochemistry microbiology" },
  { icon: Pill, title: "Clinical Pharmacy & Therapeutics", desc: "Sterile chemotherapy compounding, clinical pharmacist ward consultations, and patient discharge counseling.", tags: ["Specialist Compounding", "Discharge Counseling", "Barcode Dispensing"], keywords: "pharmacy medications dispensary prescription" },
];

const DOCTORS = [
  { initials: "DC", color: "var(--ink)", role: "Director of Cardiology", name: "Dr. Daniel Chen", quals: "MBBS (Hons), FRACP, FCSANZ, MD (Sydney)", specialty: "Interventional Cardiology & Structural Heart Disease", hours: "Mon – Thu: 08:30 – 16:30 · On-call Trauma", bio: "18+ years in acute coronary interventions, TAVI, and heart failure clinical trials." },
  { initials: "KN", color: "#0b5f66", role: "Chief Orthopedic Surgeon", name: "Dr. Krishala Niroula", quals: "MBBS, MS (Ortho), FRACS, FAOrthoA", specialty: "Robotic Joint Arthroplasty & Complex Trauma", hours: "Mon, Wed, Fri: 09:00 – 17:00 · Surgery Tue/Thu", bio: "Minimally invasive hip and knee reconstructions, robotic navigation surgery, sports medicine." },
  { initials: "LW", color: "#5b21b6", role: "Director of Pathology", name: "Dr. Lucas Wilson", quals: "MBBS, FRCPA, PhD (Molecular Genetics)", specialty: "Clinical Biochemistry & Diagnostic Hematology", hours: "Tue – Sat: 08:00 – 16:00 · 24/7 Lab Review", bio: "Leads diagnostic laboratory services, molecular screening, and digital report integration." },
  { initials: "PP", color: "#047857", role: "Emergency Care Lead", name: "Dr. Priya Paneru", quals: "MBBS, FACEM, Dip Paediatrics", specialty: "Resuscitation & Acute Trauma Medicine", hours: "Mon – Fri: 07:00 – 19:00 · Rotational Triage", bio: "Oversees emergency triage, pediatric acute presentations, and disaster coordination." },
];

const AMENITIES = [
  { icon: Train, badge: "Transport", title: "Direct Public Transit Access", desc: "A 400m sheltered walk from Kogarah Station with express trains to the CBD, plus 5 connecting bus routes." },
  { icon: Car, badge: "Parking", title: "Multi-Storey On-Site Parking", desc: "800+ underground spaces, EV charging bays, direct elevator access to all wards, patient concession rates." },
  { icon: Wifi, badge: "Digital Health", title: "Integrated Patient Portal & PWA", desc: "Access lab reports, digital invoices, clinical notes, and records from any desktop or mobile device, 24/7." },
  { icon: Waves, badge: "Rehabilitation", title: "Hydrotherapy & Wellness Suites", desc: "Heated therapeutic pool and physiotherapy gym for post-operative recovery and mobility restoration." },
  { icon: TreePine, badge: "Environment", title: "Healing Gardens & Modern Cafeteria", desc: "Landscaped healing gardens, quiet reflection rooms, and a cafeteria with chef-prepared meals." },
  { icon: Languages, badge: "Support", title: "24/7 Language & Cultural Care", desc: "Accredited interpreters in 40+ languages, plus dedicated Aboriginal and Torres Strait Islander liaison officers." },
];

const LOCATIONS = [
  { tag: "Main Hospital Campus · Code: KOG", name: "St George Hospital — Kogarah", address: "Gray Street, Kogarah NSW 2217, Australia", phone: "(02) 9113 1111", details: "Major tertiary campus · 24/7 Emergency & Trauma · Inpatient Surgical Wards · Birthing Suites · ICU · Pathology Labs." },
  { tag: "Specialist Community Branch · Code: SYD", name: "St George Community Clinic — Sydney CBD", address: "100 George Street, Sydney NSW 2000, Australia", phone: "(02) 9000 2026", details: "Outpatient specialist consultations · Telehealth hubs · Specimen collection · Physical therapy · Prescription pickup." },
];

const QUICK_TAGS = ["Cardiology", "Trauma", "Orthopedics", "Maternity", "Parking"];

// Accent colour matching the screenshot's teal/cyan scheme (used for eyebrows,
// stat numbers, badges, tags) — kept local so it doesn't touch global tokens.
const ACCENT = "#0e7f8c";
const ACCENT_BG = "#E3F3F1";

// ============================================================================
// SMALL SUB-COMPONENTS
// ============================================================================

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 36px" }}>
      <span className="f-body" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, color: ACCENT, textTransform: "uppercase" }}>
        {eyebrow}
      </span>
      <h2 className="f-display" style={{ fontSize: 30, fontWeight: 700, color: "var(--ink-deep)", margin: "8px 0 10px" }}>
        {title}
      </h2>
      <p className="f-body" style={{ fontSize: 14.5, color: "var(--muted)", lineHeight: 1.6 }}>
        {subtitle}
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PublicSite({ onEnterPortal }) {
  const [search, setSearch] = useState("");
  const [navOpen, setNavOpen] = useState(false);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SERVICES;
    return SERVICES.filter((s) => (s.title + " " + s.desc + " " + s.keywords).toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="f-body pub-root" style={{ background: "var(--mist)", minHeight: "100%" }}>
      <style>{`
        .pub-nav-link { color: var(--ink-deep); text-decoration: none; font-size: 13.5px; font-weight: 600; padding: 8px 4px; }
        .pub-nav-link:hover { color: #0a5f6a; }
        .pub-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .pub-card:hover { transform: translateY(-3px); box-shadow: 0 14px 30px -14px rgba(11,36,34,.25); }
        .pub-quick-tag { transition: background 0.15s ease, color 0.15s ease; }
        .pub-quick-tag:hover { background: var(--ink); color: #fff !important; }
        .pub-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .pub-grid--2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
        .pub-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .pub-footer-grid { display: grid; grid-template-columns: 2fr repeat(4, 1fr); gap: 28px; }
        @media (max-width: 980px) {
          .pub-grid, .pub-grid--2 { grid-template-columns: repeat(2, 1fr); }
          .pub-stats { grid-template-columns: repeat(2, 1fr); }
          .pub-footer-grid { grid-template-columns: repeat(2, 1fr); }
          .pub-desktop-nav { display: none !important; }
        }
        @media (max-width: 620px) {
          .pub-grid, .pub-grid--2, .pub-stats { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ---------- Header ---------- */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(245,246,242,.92)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <a href="#pub-home" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Cross size={18} color="#fff" />
            </span>
            <span>
              <div className="f-display" style={{ fontWeight: 700, fontSize: 15, color: "var(--ink-deep)" }}>St George Hospital</div>
              <div className="f-body" style={{ fontSize: 10.5, color: "var(--muted)" }}>Kogarah & Sydney · Caring since 1894</div>
            </span>
          </a>

          <nav className="pub-desktop-nav" style={{ display: "flex", gap: 22 }}>
            <a className="pub-nav-link" href="#pub-services">Specialties & Services</a>
            <a className="pub-nav-link" href="#pub-doctors">Senior Doctors</a>
            <a className="pub-nav-link" href="#pub-amenities">Perks & Amenities</a>
            <a className="pub-nav-link" href="#pub-locations">Locations & Hours</a>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <InstallButton />
            <button
              onClick={onEnterPortal}
              className="f-body"
              style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--ink)", color: "#fff", border: "none", borderRadius: 999, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              <ShieldCheck size={15} />
              Staff & Patient Portal
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ---------- Emergency bar ---------- */}
      <div style={{ background: "var(--ink-deep)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "9px 20px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <span className="f-body" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, color: "#fff" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--rose)", animation: "pubPulse 1.6s ease-in-out infinite" }} />
            24/7 Level 1 Emergency Open
          </span>
          <span className="f-body" style={{ fontSize: 12, color: "#B9C7C2" }}>
            General Visiting Hours: <strong style={{ color: "#fff" }}>10:00 AM – 8:00 PM Daily</strong>
          </span>
          <a href="tel:0291131111" className="f-body" style={{ fontSize: 12, color: "#B9C7C2", textDecoration: "none" }}>
            Emergency Triage: <strong style={{ color: "#fff" }}>(02) 9113 1111</strong>
          </a>
        </div>
      </div>
      <style>{`@keyframes pubPulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }`}</style>

      {/* ---------- Hero ---------- */}
      <section id="pub-home" style={{ padding: "64px 20px 56px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <span className="f-body" style={{ display: "inline-block", fontSize: 11.5, fontWeight: 700, color: ACCENT, background: ACCENT_BG, border: "1px solid #BFE3DF", borderRadius: 999, padding: "5px 14px", marginBottom: 18 }}>
            NSW Health Accredited Tertiary Teaching Hospital
          </span>
          <h1 className="f-display" style={{ fontSize: 44, fontWeight: 700, color: "var(--ink-deep)", lineHeight: 1.15, margin: "0 0 16px" }}>
            World-Class Medicine.<br />Compassionate Care.
          </h1>
          <p className="f-body" style={{ fontSize: 15.5, color: "var(--muted)", lineHeight: 1.65, maxWidth: 600, margin: "0 auto 30px" }}>
            Leading clinical treatments, advanced surgical specialties, accredited diagnostics, and 24/7 trauma
            emergency care across southern Sydney and New South Wales.
          </p>

          {/* Live search */}
          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: 8, boxShadow: "0 12px 32px -18px rgba(11,36,34,.3)", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
              <Search size={17} color="var(--muted)" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clinical specialties, doctors, or amenities..."
                className="f-body"
                style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 30 }}>
            <span className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", marginRight: 2, paddingTop: 6 }}>Popular:</span>
            {QUICK_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => setSearch(t)}
                className="f-body pub-quick-tag"
                style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-deep)", background: "#fff", border: "1px solid var(--line)", borderRadius: 999, padding: "6px 13px", cursor: "pointer" }}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 40 }}>
            <a href="#pub-doctors" className="f-body" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--ink)", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 13.5, borderRadius: 10, padding: "12px 22px" }}>
              Find a Senior Doctor <ArrowRight size={15} />
            </a>
            <a href="#pub-services" className="f-body" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "var(--ink-deep)", border: "1px solid var(--line)", textDecoration: "none", fontWeight: 700, fontSize: 13.5, borderRadius: 10, padding: "12px 22px" }}>
              Explore Clinical Departments
            </a>
          </div>

          <div className="pub-stats">
            {[
              ["600+", "Hospital Inpatient Beds"],
              ["24/7", "Level 1 Adult Trauma"],
              ["50+", "Specialized Departments"],
              ["2 Campuses", "Kogarah & Sydney CBD"],
            ].map(([num, label]) => (
              <div key={label} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 10px" }}>
                <div className="f-display" style={{ fontSize: 20, fontWeight: 700, color: ACCENT }}>{num}</div>
                <div className="f-body" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Services ---------- */}
      <section id="pub-services" style={{ padding: "50px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <SectionHeader
            eyebrow="Excellence in Clinical Care"
            title="Specializations & Clinical Services"
            subtitle="Comprehensive specialized medicine and interdisciplinary teams supporting patients at every stage of recovery."
          />
          {filteredServices.length === 0 ? (
            <div className="f-body" style={{ textAlign: "center", color: "var(--muted)", fontSize: 13.5 }}>
              No services match "{search}". Try another search term.
            </div>
          ) : (
            <div className="pub-grid">
              {filteredServices.map((s) => (
                <div key={s.title} className="pub-card" style={{ background: "var(--mist)", border: "1px solid var(--line)", borderRadius: 16, padding: 20 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <s.icon size={18} color="#fff" />
                  </div>
                  <div className="f-display" style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 6 }}>{s.title}</div>
                  <p className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, marginBottom: 12 }}>{s.desc}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {s.tags.map((t) => (
                      <span key={t} className="f-body" style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink-deep)", background: "#fff", border: "1px solid var(--line)", borderRadius: 999, padding: "3px 9px" }}>{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- Doctors ---------- */}
      <section id="pub-doctors" style={{ padding: "50px 20px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <SectionHeader
            eyebrow="Medical Leadership"
            title="Senior Doctors & Specialist Directory"
            subtitle="Meet our credentialed department heads, consultant physicians, and leading surgeons."
          />
          <div className="pub-grid--2">
            {DOCTORS.map((d) => (
              <div key={d.name} className="pub-card" style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: 20, display: "flex", gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: d.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }} className="f-display">
                  {d.initials}
                </div>
                <div>
                  <div className="f-body" style={{ display: "inline-block", fontSize: 10, fontWeight: 700, color: ACCENT, background: ACCENT_BG, borderRadius: 999, padding: "3px 9px", textTransform: "uppercase", letterSpacing: 0.4 }}>{d.role}</div>
                  <div className="f-display" style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-deep)", margin: "2px 0 6px" }}>{d.name}</div>
                  <p className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", margin: "0 0 3px" }}><strong style={{ color: "var(--ink-deep)" }}>Qualifications:</strong> {d.quals}</p>
                  <p className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", margin: "0 0 6px" }}><strong style={{ color: "var(--ink-deep)" }}>Specialty:</strong> {d.specialty}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>
                    <Calendar size={12} /> {d.hours}
                  </div>
                  <p className="f-body" style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5 }}>{d.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Amenities ---------- */}
      <section id="pub-amenities" style={{ padding: "50px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <SectionHeader
            eyebrow="Patient Experience"
            title="Hospital Perks & Modern Amenities"
            subtitle="Designed for comfort, accessibility, and healing for patients, families, and visiting carers."
          />
          <div className="pub-grid">
            {AMENITIES.map((a) => (
              <div key={a.title} className="pub-card" style={{ background: "var(--mist)", border: "1px solid var(--line)", borderRadius: 16, padding: 20 }}>
                <span className="f-body" style={{ display: "inline-block", fontSize: 10, fontWeight: 700, color: "var(--ink)", background: "#E4E9E7", borderRadius: 999, padding: "3px 10px", marginBottom: 10 }}>{a.badge}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <a.icon size={16} color="var(--ink)" />
                  <div className="f-display" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-deep)" }}>{a.title}</div>
                </div>
                <p className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Locations ---------- */}
      <section id="pub-locations" style={{ padding: "50px 20px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <SectionHeader
            eyebrow="Our Campuses"
            title="Locations & Immediate Contacts"
            subtitle="Serving patients through our flagship hospital campus and specialized community clinical branch."
          />
          <div className="pub-grid--2">
            {LOCATIONS.map((l) => (
              <div key={l.name} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: 22 }}>
                <span className="f-body" style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, color: ACCENT, background: ACCENT_BG, borderRadius: 999, padding: "3px 10px", marginBottom: 10 }}>{l.tag}</span>
                <div className="f-display" style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 8 }}>{l.name}</div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
                  <MapPin size={14} color="var(--muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span className="f-body" style={{ fontSize: 12.5, color: "var(--muted)" }}>{l.address}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Phone size={14} color="var(--muted)" />
                  <span className="f-body" style={{ fontSize: 12.5, color: "var(--muted)" }}>{l.phone}</span>
                </div>
                <p className="f-body" style={{ fontSize: 12, color: "var(--ink-deep)", lineHeight: 1.55 }}>{l.details}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer style={{ background: "var(--ink-deep)", padding: "44px 20px 24px" }}>
        <div className="pub-footer-grid" style={{ maxWidth: 1160, margin: "0 auto 28px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Cross size={16} color="#fff" />
              </span>
              <span className="f-display" style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>St George Hospital</span>
            </div>
            <p className="f-body" style={{ fontSize: 12, color: "#9CAAA6", lineHeight: 1.6, marginBottom: 12 }}>
              Serving Kogarah, southern Sydney, and New South Wales with high-reliability clinical care and patient-centered healing.
            </p>
            <div className="f-body" style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>Triage Hotline: (02) 9113 1111</div>
          </div>
          {[
            { h: "About Us", items: ["About Our Hospital", "Hospital History", "Executive Leadership", "General Contact"] },
            { h: "Clinical Services", items: ["Cardiology & Heart", "Oncology & Chemotherapy", "Orthopaedics & Joint", "Intensive Care Unit"] },
            { h: "For Patients", items: ["Pre-Admission Guide", "Preparing for Surgery", "Rights & Responsibilities", "Privacy & Records"] },
            { h: "Visitors & GPs", items: ["Parking Rates", "Visiting Hours", "Public Transport", "GP Referrals"] },
          ].map((col) => (
            <div key={col.h}>
              <div className="f-body" style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{col.h}</div>
              {col.items.map((i) => (
                <div key={i} className="f-body" style={{ fontSize: 11.5, color: "#9CAAA6", marginBottom: 8 }}>{i}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1160, margin: "0 auto", borderTop: "1px solid #1D4844", paddingTop: 18 }}>
          <p className="f-body" style={{ fontSize: 11, color: "#7E938E", textAlign: "center" }}>
            © 2026 St George Hospital Management System. All rights reserved. NSW Health Public Accreditations.
          </p>
        </div>
      </footer>
    </div>
  );
}
