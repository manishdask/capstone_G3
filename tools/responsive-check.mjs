// Measures real horizontal overflow across mobile viewports by driving the
// installed Chrome over the DevTools Protocol (no npm dependencies).
//
//   node tools/responsive-check.mjs [baseUrl]
//
// For each viewport it loads the app, walks the demo routes, and reports any
// element whose right edge exceeds the viewport — the actual cause of the
// "content cut off / page scrolls sideways" bug.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] || "http://localhost:5173";
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

// The listed device widths, plus in-between and boundary widths so the layout
// is proven to hold at sizes nobody named (and right at each media-query edge).
const VIEWPORTS = process.env.QUICK
  ? [
      { w: 320, h: 568, label: "320  iPhone SE / small Android" },
      { w: 375, h: 812, label: "375  iPhone 12/13 mini" },
      { w: 430, h: 932, label: "430  iPhone 15/16 Pro Max" },
      { w: 768, h: 1024, label: "768  iPad portrait" },
    ]
  : [
      { w: 320, h: 568, label: "320  iPhone SE / small Android" },
      { w: 344, h: 700, label: "344  in-between" },
      { w: 360, h: 800, label: "360  common Android" },
      { w: 375, h: 812, label: "375  iPhone 12/13 mini" },
      { w: 390, h: 844, label: "390  iPhone 14/15" },
      { w: 402, h: 874, label: "402  in-between" },
      { w: 414, h: 896, label: "414  Android flagship" },
      { w: 430, h: 932, label: "430  iPhone 15/16 Pro Max" },
      { w: 480, h: 900, label: "480  media-query edge" },
      { w: 540, h: 960, label: "540  small tablet / foldable" },
      { w: 560, h: 960, label: "560  media-query edge" },
      { w: 620, h: 900, label: "620  media-query edge" },
      { w: 768, h: 1024, label: "768  iPad portrait" },
      { w: 900, h: 1200, label: "900  media-query edge" },
      { w: 1024, h: 1366, label: "1024 iPad landscape" },
    ];

const PORT = 9333;
let msgId = 0;

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const pending = new Map();
    const events = new Map();
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) {
        const { resolve: res, reject: rej } = pending.get(m.id);
        pending.delete(m.id);
        m.error ? rej(new Error(m.error.message)) : res(m.result);
      } else if (m.method && events.has(m.method)) {
        events.get(m.method).forEach((fn) => fn(m.params));
      }
    };
    ws.onerror = () => reject(new Error("CDP socket error"));
    ws.onopen = () =>
      resolve({
        send(method, params = {}, sessionId) {
          const id = ++msgId;
          return new Promise((res, rej) => {
            pending.set(id, { resolve: res, reject: rej });
            ws.send(JSON.stringify({ id, method, params, sessionId }));
          });
        },
        on(method, fn) {
          if (!events.has(method)) events.set(method, []);
          events.get(method).push(fn);
        },
        close: () => ws.close(),
      });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForEndpoint() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return (await res.json()).webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error("Chrome did not expose a debugging endpoint");
}

// Runs in the page: find every element sticking out past the viewport.
const OVERFLOW_PROBE = `(() => {
  const vw = document.documentElement.clientWidth;
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    // Ignore purely decorative absolutely-positioned rings/blobs that are
    // deliberately clipped by an ancestor with overflow:hidden.
    let clipped = false;
    for (let p = el.parentElement; p; p = p.parentElement) {
      const pcs = getComputedStyle(p);
      if (pcs.overflow === "hidden" || pcs.overflowX === "hidden") { clipped = true; break; }
    }
    if (clipped) continue;
    const over = Math.round(r.right - vw);
    if (over > 1) {
      const sig = el.tagName + "." + (el.className && el.className.baseVal === undefined ? String(el.className).slice(0, 40) : "");
      if (seen.has(sig + over)) continue;
      seen.add(sig + over);
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: typeof el.className === "string" ? el.className.slice(0, 40) : "",
        text: (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 45),
        over,
        w: Math.round(r.width),
      });
    }
  }
  out.sort((a, b) => b.over - a.over);

  // Text that is wider than the box holding it. A block element always reports
  // its container's width via getBoundingClientRect, so an oversized heading
  // never shows up as a "box" offender — it just gets visually clipped. This is
  // the "paragraph cut off mid-word" symptom, and scrollWidth catches it.
  const textOver = [];
  for (const el of document.querySelectorAll("body *")) {
    if (!el.firstChild || el.children.length > 2) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    if (cs.overflowX === "auto" || cs.overflowX === "scroll") continue;
    const spill = el.scrollWidth - el.clientWidth;
    if (el.clientWidth > 0 && spill > 1) {
      textOver.push({
        tag: el.tagName.toLowerCase(),
        spill,
        box: el.clientWidth,
        content: el.scrollWidth,
        fs: cs.fontSize,
        text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 45),
      });
    }
  }
  textOver.sort((a, b) => b.spill - a.spill);

  return JSON.stringify({
    docScrollW: document.documentElement.scrollWidth,
    bodyScrollW: document.body.scrollWidth,
    vw,
    offenders: out.slice(0, 8),
    textOver: textOver.slice(0, 6),
  });
})()`;

// Drives the SPA to a named screen. The app has no router, so we click.
const NAV = {
  "public home": `(() => "ok")()`,
  login: `(() => {
    const b = [...document.querySelectorAll("button")].find(x => /Staff & Patient Portal/i.test(x.textContent));
    if (b) { b.click(); return "clicked"; } return "already";
  })()`,
};

async function evaluate(cdp, sessionId, expr, awaitPromise = false) {
  const r = await cdp.send(
    "Runtime.evaluate",
    { expression: expr, returnByValue: true, awaitPromise },
    sessionId
  );
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
  return r.result.value;
}

// Logs in through the real form and lands on a portal screen.
const LOGIN_AS = (email) => `(async () => {
  const setVal = (el, v) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const inputs = [...document.querySelectorAll("input")];
  const user = inputs.find(i => i.type !== "password");
  const pass = inputs.find(i => i.type === "password");
  if (!user || !pass) return "no-form";
  setVal(user, ${JSON.stringify(email)});
  setVal(pass, "Password123!");
  // The screen has a "Sign In" TAB as well as the submit button, so target the
  // submit button explicitly rather than by loose text match.
  const btn = document.querySelector('button[type="submit"]');
  if (!btn) return "no-button";
  btn.click();
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 250));
    if (!document.querySelector('input[type="password"]') && localStorage.getItem("sgh_token")) return "logged-in";
  }
  const err = [...document.querySelectorAll('[role="alert"], .sgh-err')].map(e => e.textContent.trim()).join(" | ");
  return "timeout" + (err ? " :: " + err : "");
})()`;

const OPEN_FIRST_DOCTOR = `(async () => {
  // The clickable row is the div wrapping the avatar + name block; find the
  // leaf node holding the doctor's name and walk up two levels to it.
  // Give the doctor list time to arrive from the API before giving up.
  let name = null;
  for (let i = 0; i < 20 && !name; i++) {
    // No regex here: this string is a JS template literal, so backslash escapes
    // get consumed before the page sees them.
    name = [...document.querySelectorAll("div")].find(d => d.children.length === 0 && (d.textContent || "").trim().startsWith("Dr"));
    if (!name) await new Promise(r => setTimeout(r, 300));
  }
  if (!name) return "no-doctor-row :: " + document.body.textContent.replace(/\s+/g," ").trim().slice(0, 300);
  const row = name.parentElement && name.parentElement.parentElement;
  if (!row) return "no-row";
  row.click();
  await new Promise(r => setTimeout(r, 1600));
  return document.body.textContent.includes("Choose date") ? "opened" : "no-slot-picker";
})()`;

const OPEN_PAY_MODAL = `(async () => {
  let inv = null;
  for (let i = 0; i < 20 && !inv; i++) {
    inv = [...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Invoices");
    if (!inv) await new Promise(r => setTimeout(r, 300));
  }
  if (!inv) return "no-invoices-tab on screen: " + document.body.textContent.trim().slice(0, 80);
  inv.click();
  await new Promise(r => setTimeout(r, 1200));
  const pay = [...document.querySelectorAll("button")].find(b => /Pay online/i.test(b.textContent));
  if (!pay) return "no-pay-button";
  pay.click();
  await new Promise(r => setTimeout(r, 2000));
  return document.body.textContent.includes("Online Checkout") ? "opened" : "modal-did-not-open";
})()`;

const OPEN_CHATBOT = `(async () => {
  const fab = [...document.querySelectorAll("button")].filter(b => b.textContent.trim() === "" && b.querySelector("svg")).pop();
  if (!fab) return "no-fab";
  fab.click();
  await new Promise(r => setTimeout(r, 1000));
  return /virtual assistant|SGH Assistant/i.test(document.body.textContent) ? "opened" : "not-open";
})()`;

const CLICK_TAB = (label) => `(async () => {
  const b = [...document.querySelectorAll("button")].find(x => x.textContent.trim() === ${JSON.stringify(label)});
  if (!b) return "no-tab:" + ${JSON.stringify(label)};
  b.click();
  await new Promise(r => setTimeout(r, 900));
  return "ok";
})()`;

async function main() {
  const profile = mkdtempSync(join(tmpdir(), "sgh-resp-"));
  const chrome = spawn(
    CHROME,
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  let cdp;
  const results = [];
  try {
    cdp = await connect(await waitForEndpoint());
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);

    const consoleErrors = [];
    cdp.on("Runtime.consoleAPICalled", (p) => {
      if (p.type === "error") consoleErrors.push(p.args.map((a) => a.value || a.description).join(" ").slice(0, 160));
    });
    cdp.on("Runtime.exceptionThrown", (p) =>
      consoleErrors.push("EXCEPTION " + (p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || "").slice(0, 160))
    );

    for (const vp of VIEWPORTS) {
      await cdp.send(
        "Emulation.setDeviceMetricsOverride",
        { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: true },
        sessionId
      );

      const screens = [];
      const probe = async (label) => screens.push([label, JSON.parse(await evaluate(cdp, sessionId, OVERFLOW_PROBE))]);
      const resetSession = async () => {
        await evaluate(cdp, sessionId, 'localStorage.removeItem("sgh_token")');
        await cdp.send("Page.navigate", { url: BASE }, sessionId);
        await sleep(1400);
      };

      // --- Public landing page ---
      await cdp.send("Page.navigate", { url: BASE }, sessionId);
      await sleep(1600);
      await probe("public landing");

      // --- Login + registration form ---
      await evaluate(cdp, sessionId, NAV.login);
      await sleep(700);
      await probe("login");
      await evaluate(cdp, sessionId, CLICK_TAB("Self-Registration (Patient)"), true);
      await probe("register form");
      await evaluate(cdp, sessionId, CLICK_TAB("Sign In"), true);

      // --- Patient portal, including the booking flow and modals ---
      const logged = await evaluate(cdp, sessionId, LOGIN_AS("patient.NSW@example.test"), true);
      if (logged === "logged-in") {
        await sleep(700);
        await probe("patient · Home");
        for (const tab of ["Doctors", "Appts", "Records", "Feedback", "Profile"]) {
          await evaluate(cdp, sessionId, CLICK_TAB(tab), true);
          await probe("patient · " + tab);
        }
        await evaluate(cdp, sessionId, CLICK_TAB("Doctors"), true);
        await sleep(1000);
        const picked = await evaluate(cdp, sessionId, OPEN_FIRST_DOCTOR, true);
        if (picked === "opened") await probe("patient · booking slots");
        else screens.push(["patient · booking slots", { skipped: picked }]);

        await evaluate(cdp, sessionId, CLICK_TAB("Records"), true);
        await sleep(700);
        const modal = await evaluate(cdp, sessionId, OPEN_PAY_MODAL, true);
        if (modal === "opened") await probe("patient · checkout modal");
        else screens.push(["patient · checkout modal", { skipped: modal }]);

        const chat = await evaluate(cdp, sessionId, OPEN_CHATBOT, true);
        if (chat === "opened") await probe("patient · chatbot");
        else screens.push(["patient · chatbot", { skipped: chat }]);
      } else {
        screens.push(["patient portal", { error: "login failed: " + logged }]);
      }

      // --- Doctor portal ---
      await resetSession();
      await evaluate(cdp, sessionId, NAV.login);
      await sleep(600);
      if ((await evaluate(cdp, sessionId, LOGIN_AS("doctor1.NSW@stgeorge.test"), true)) === "logged-in") {
        await sleep(700);
        await probe("doctor · Schedule");
        for (const tab of ["Upcoming", "Patients", "Profile"]) {
          await evaluate(cdp, sessionId, CLICK_TAB(tab), true);
          await probe("doctor · " + tab);
        }
      }

      // --- Staff portals (each role sees a different tab set) ---
      for (const [email, role, tabs] of [
        ["receptionist.NSW@stgeorge.test", "reception", ["Vitals", "Admissions"]],
        ["pharmacist.NSW@stgeorge.test", "pharmacy", ["Pharmacy"]],
        ["lab_technician.NSW@stgeorge.test", "labtech", ["Lab Desk"]],
      ]) {
        await resetSession();
        await evaluate(cdp, sessionId, NAV.login);
        await sleep(600);
        if ((await evaluate(cdp, sessionId, LOGIN_AS(email), true)) === "logged-in") {
          await sleep(700);
          await probe(role + " · Appts");
          for (const tab of tabs) {
            await evaluate(cdp, sessionId, CLICK_TAB(tab), true);
            await probe(role + " · " + tab);
          }
        }
      }

      // --- Admin dashboard: every tab ---
      await resetSession();
      await evaluate(cdp, sessionId, NAV.login);
      await sleep(600);
      if ((await evaluate(cdp, sessionId, LOGIN_AS("admin@stgeorge.test"), true)) === "logged-in") {
        await sleep(900);
        await probe("admin · Overview");
        for (const tab of ["Branches", "Staff", "Config", "Branch Config", "Feedback",
                           "Data Requests", "Duplicates", "Break-Glass", "Payments",
                           "Reports", "Audit log"]) {
          await evaluate(cdp, sessionId, CLICK_TAB(tab), true);
          await probe("admin · " + tab);
        }
      }
      await evaluate(cdp, sessionId, 'localStorage.removeItem("sgh_token")');

      results.push({ vp, screens });
    }

    // ---- report ----
    let bad = 0, good = 0;
    for (const { vp, screens } of results) {
      console.log(`\n━━ ${vp.label}  (${vp.w}×${vp.h}) ━━━━━━━━━━━━━━━━━━━━━━`);
      for (const [name, r] of screens) {
        if (r.error) { console.log(`   ??  ${name.padEnd(26)} ${r.error}`); continue; }
        if (r.skipped) { console.log(`   --  ${name.padEnd(26)} not reached (${r.skipped})`); continue; }
        const scrolls = r.docScrollW > r.vw + 1;
        const textBad = (r.textOver || []).length > 0;
        if (!scrolls && r.offenders.length === 0 && !textBad) { good++; console.log(`   OK  ${name}`); continue; }
        bad++;
        console.log(`   XX  ${name.padEnd(26)}${scrolls ? ` page scrolls sideways: ${r.docScrollW} > ${r.vw} (+${r.docScrollW - r.vw}px)` : " text clipped inside its box"}`);
        for (const o of r.offenders)
          console.log(`         box  ${("<" + o.tag + ">").padEnd(8)} w=${String(o.w).padEnd(5)} +${String(o.over).padEnd(4)} ${o.cls ? "." + o.cls + " " : ""}"${o.text}"`);
        for (const t of r.textOver || [])
          console.log(`         text ${("<" + t.tag + ">").padEnd(8)} ${t.content}px of content in a ${t.box}px box (+${t.spill}, ${t.fs}) "${t.text}"`);
      }
    }
    console.log(`\n${"=".repeat(60)}`);
    console.log(`RESULT: ${good} screens clean / ${bad} overflowing`);
    if (consoleErrors.length) {
      console.log(`\nConsole errors (${consoleErrors.length}):`);
      [...new Set(consoleErrors)].slice(0, 10).forEach((e) => console.log("  - " + e));
    } else {
      console.log("Console: no errors");
    }
    process.exitCode = bad ? 1 : 0;
  } finally {
    try { cdp?.close(); } catch {}
    chrome.kill();
    await sleep(400);
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(2); });
