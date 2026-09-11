// End-to-end verification of the demo flow described in the project report's
// "Quick Reference for Lecturers" table, run against the live API.
//
//   node tools/demo-flow-check.mjs [baseUrl]
//
// Exercises the full clinical/billing path with real HTTP calls and checks the
// resulting database state, including deliberately-provoked failure cases
// (double booking, cross-patient access, unauthenticated access). Exits non-zero
// if any check fails, so it can gate a change the same way a test suite would.
const API = (process.argv[2] || "http://localhost:8000") + "/api";
let pass = 0, fail = 0;
const ok = (c, label, extra = "") => { c ? (pass++, console.log(`  PASS  ${label} ${extra}`)) : (fail++, console.log(`  FAIL  ${label} ${extra}`)); };

async function call(method, path, { token, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: "Bearer " + token } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const t = await res.text();
  let j; try { j = JSON.parse(t); } catch { j = { _raw: t.slice(0, 150) }; }
  return { status: res.status, json: j };
}
const login = (l) => call("POST", "/auth/login", { body: { login: l, password: "Password123!" } });
const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toTime = (m) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
const dateKey = (v) => new Date(v).toLocaleDateString("en-CA");

// Mirrors computeSlots() in src/pages/patient/PatientDoctorProfile.jsx
function computeSlots(schedules, booked, duration = 30) {
  const out = [];
  for (const w of schedules) {
    let c = toMin(w.start_time); const end = toMin(w.end_time);
    while (c + duration <= end) {
      const e = c + duration;
      if (!booked.some((b) => toMin(b.start_time) < e && toMin(b.end_time) > c)) out.push(toTime(c));
      c += duration;
    }
  }
  return out;
}

(async () => {
  console.log("\n=== A. SEEDED DEMO LOGINS ===");
  const accounts = [
    ["patient.NSW@example.test", "Patient"],
    ["doctor1.NSW@stgeorge.test", "Doctor"],
    ["admin@stgeorge.test", "Admin"],
    ["manager.NSW@stgeorge.test", "Branch Manager"],
    ["receptionist.NSW@stgeorge.test", "Receptionist"],
    ["nurse.NSW@stgeorge.test", "Nurse"],
    ["pharmacist.NSW@stgeorge.test", "Pharmacist"],
    ["lab_technician.NSW@stgeorge.test", "Lab Technician"],
  ];
  const tok = {};
  for (const [email, role] of accounts) {
    const r = await login(email);
    ok(r.status === 200 && !!r.json.token, `${role.padEnd(15)} ${email}`, `(${r.status})`);
    tok[role] = r.json.token;
  }
  ok((await login("patient.nsw.at.example.test")).status === 200, "login by generated username also works");

  const PT = tok["Patient"], DR = tok["Doctor"], AD = tok["Admin"];
  const pu = (await call("GET", "/auth/me", { token: PT })).json.data;

  console.log("\n=== B. SEEDED DEMO CONTENT ===");
  for (const [label, path] of [["appointments", "/appointments"], ["invoices", "/invoices"], ["lab orders", "/lab-orders"], ["prescriptions", "/prescriptions"]]) {
    const n = ((await call("GET", path + "?per_page=50", { token: PT })).json.data || []).length;
    ok(n > 0, `patient has ${label}`, `(${n})`);
  }
  const pend = ((await call("GET", "/invoices?per_page=50", { token: PT })).json.data || []).filter((i) => i.status === "pending");
  ok(pend.length > 0, "an unpaid invoice exists to demonstrate payment", `(${pend.length})`);

  console.log("\n=== C. CLINICAL / BILLING FLOW ===");
  const docs = (await call("GET", `/staff?staff_type=doctor&branch_id=${pu.branch_id}&per_page=50`, { token: PT })).json.data || [];
  const me = (await call("GET", "/auth/me", { token: DR })).json.data;
  const mine = docs.find((d) => d.id === me.staff?.id) || docs[0];
  const today = dateKey(new Date());
  const av = await call("GET", `/doctors/${mine.id}/availability?date=${today}`, { token: PT });
  const slots = computeSlots(av.json.data?.schedules || [], av.json.data?.booked_slots || []);
  ok(slots.length > 0, "FR17 doctor availability returns bookable slots", `(${slots.length})`);

  let booked = null, bookResp = null, used = null;
  for (const start of slots) {
    const r = await call("POST", "/appointments", { token: PT, body: {
      branch_id: mine.branch_id, specialization: mine.doctor?.specialization,
      doctor_staff_id: mine.id, appointment_date: today,
      start_time: start, end_time: toTime(toMin(start) + 30), reason: "Requested via Patient App" } });
    if (r.status === 201) { bookResp = r.json; booked = r.json.data; used = start; break; }
    ok(false, "FR16 book appointment", `(${r.status}) ${JSON.stringify(r.json).slice(0, 140)}`); break;
  }
  ok(booked?.status === "confirmed", "FR16/FR18 booking auto-confirms (documented deviation)", `apt#${booked?.id} @ ${used}`);
  ok(bookResp?.invoice_id != null, "FR36 consultation invoice raised at booking (documented deviation)", `invoice#${bookResp?.invoice_id}`);

  const dup = await call("POST", "/appointments", { token: PT, body: {
    branch_id: mine.branch_id, specialization: mine.doctor?.specialization, doctor_staff_id: mine.id,
    appointment_date: today, start_time: used, end_time: toTime(toMin(used) + 30), reason: "conflict probe" } });
  ok(dup.status === 409, "FR19 overlapping booking rejected", `(${dup.status})`);

  const invId = bookResp.invoice_id;
  const pdf = await fetch(`${API}/invoices/${invId}/pdf`, { headers: { Authorization: "Bearer " + PT } });
  ok(pdf.ok, "FR38 invoice PDF downloads", `(${pdf.status})`);
  const co = (await call("POST", `/invoices/${invId}/checkout`, { token: PT })).json.data;
  const cf = await call("POST", `/invoices/${invId}/confirm`, { token: PT, body: { gateway_reference: co.gateway_reference } });
  ok(cf.status === 200 || cf.status === 201, "FR40 sandbox gateway payment confirmed server-side", `provider=${co.provider}`);
  ok(((await call("GET", `/invoices/${invId}`, { token: PT })).json.data || {}).status === "paid", "FR39 invoice transitions to paid");

  ok((await call("POST", "/lab-orders", { token: DR, body: {
    patient_id: pu.patient.id, branch_id: pu.branch_id, appointment_id: booked.id, test_type: "Full Blood Count" } })).status === 201,
    "FR31 lab order linked to the visit");
  ok((await call("POST", "/procedure-bookings", { token: DR, body: {
    patient_id: pu.patient.id, branch_id: pu.branch_id, appointment_id: booked.id, name: "X-Ray" } })).status === 201,
    "FR37 procedure recorded against the visit");

  const todayList = ((await call("GET", "/appointments?status=confirmed&per_page=50", { token: DR })).json.data || [])
    .filter((a) => dateKey(a.appointment_date) === today);
  ok(todayList.some((a) => a.id === booked.id), "visit appears on the doctor's schedule for today");
  ok((await call("PATCH", `/appointments/${booked.id}/status`, { token: DR, body: { status: "completed", reason: "Visit completed" } })).status === 200,
     "FR18 doctor marks the visit completed");

  const forApt = ((await call("GET", "/invoices?per_page=50", { token: PT })).json.data || []).filter((i) => i.appointment_id === booked.id);
  const supp = forApt.find((i) => i.id !== invId);
  const suppFull = supp ? (await call("GET", `/invoices/${supp.id}`, { token: PT })).json.data : null;
  ok(forApt.length === 2 && Number(suppFull?.total_amount) === 165,
     "FR37 lab + procedure billed on a supplementary invoice", `$${suppFull?.total_amount}`);
  ok(!(suppFull?.items || []).some((i) => /consultation/i.test(i.description)), "consultation is not double-charged");

  console.log("\n=== D. REPORTING, EXPORTS AND AI ===");
  const ai = await call("POST", "/ai/chat", { token: PT, body: { message: "What are your opening hours?" } });
  ok(ai.status === 200 && (ai.json.data?.text || "").length > 20, "FR46 chatbot answers a supported question");
  const esc = await call("POST", "/ai/chat", { token: PT, body: { message: "I have chest pain, what should I take?" } });
  ok(esc.json.data?.escalate === true && esc.json.data?.provider === null,
     "FR46 privacy gate escalates clinical input before any external call");

  for (const [label, path] of [["FR41 summary", "/reports/summary"], ["FR41 trend", "/reports/trend"],
       ["FR44 department comparison", "/reports/department-comparison"], ["FR55 audit log", "/audit-logs"],
       ["FR56 security alerts", "/security-alerts"], ["FR62 duplicate flags", "/patient-duplicates"],
       ["FR51 break-glass", "/break-glass"], ["FR59 settings", "/settings"]]) {
    ok((await call("GET", path, { token: AD })).status === 200, label, path);
  }
  for (const [label, path] of [["FR42 CSV export", "/reports/export.csv"], ["FR42 PDF export", "/reports/export.pdf"], ["FR55 audit CSV export", "/audit-logs/export.csv"]]) {
    const r = await fetch(API + path, { headers: { Authorization: "Bearer " + AD } });
    ok(r.ok, label, `(${r.status})`);
  }

  console.log("\n=== E. ACCESS-CONTROL BOUNDARIES ===");
  ok((await call("GET", "/appointments")).status === 401, "unauthenticated request returns 401 (not a 500 stack trace)");
  ok((await call("GET", "/appointments", { token: "9|invalidtoken" })).status === 401, "invalid bearer token returns 401");
  ok((await call("GET", "/audit-logs", { token: DR })).status === 403, "doctor blocked from admin-only audit log (403)");
  ok((await call("GET", "/appointments", { token: DR })).status === 200, "doctor allowed on their own permitted route (200)");

  // Book a throwaway appointment specifically for the cancellation checks rather
  // than reusing whatever happens to be left in the database. Without this the
  // number of checks performed varies between runs, so the totals from two runs
  // are not comparable.
  const avail = (await call("GET", `/doctors/${mine.id}/availability?date=${today}`, { token: PT })).json.data;
  let own = null;
  for (const start of computeSlots(avail?.schedules || [], avail?.booked_slots || [])) {
    const r = await call("POST", "/appointments", { token: PT, body: {
      branch_id: mine.branch_id, specialization: mine.doctor?.specialization,
      doctor_staff_id: mine.id, appointment_date: today,
      start_time: start, end_time: toTime(toMin(start) + 30), reason: "Cancellation check" } });
    if (r.status === 201) { own = r.json.data; break; }
  }
  ok(!!own, "set up a fresh appointment for the cancellation checks");
  ok(!!own && (await call("PATCH", `/appointments/${own.id}/status`, { token: PT,
       body: { status: "cancelled", reason: "Cancelled by patient" } })).status === 200,
     "patient cancels their own appointment");

  const foreign = ((await call("GET", "/appointments?per_page=50", { token: AD })).json.data || [])
    .find((a) => a.patient_id !== pu.patient.id && ["pending", "confirmed"].includes(a.status));
  ok(!!foreign, "another patient has an open appointment to test the ownership boundary against");
  ok(!!foreign && (await call("PATCH", `/appointments/${foreign.id}/status`, { token: PT,
       body: { status: "cancelled" } })).status === 403,
     "patient blocked from cancelling another patient's appointment");

  console.log(`\n${"=".repeat(60)}\nRESULT: ${pass} pass / ${fail} fail`);
  process.exitCode = fail ? 1 : 0;
})();
