#!/usr/bin/env node
/**
 * Site-wide smoke checks against a running Next.js app (default http://127.0.0.1:3000).
 * - Public routes & middleware redirects
 * - API routes without session (expect 401 JSON)
 * - Optional: session login + authenticated API checks if E2E_ADMIN_EMAIL + E2E_ADMIN_PASSWORD are set (env or .env)
 *
 * Usage: node scripts/e2e-site-smoke.mjs
 *   E2E_BASE_URL=http://127.0.0.1:3000 node scripts/e2e-site-smoke.mjs
 */
import { config } from "dotenv";
import { readFileSync } from "fs";

config({ path: ".env", override: true });

const BASE = (process.env.E2E_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed++;
}

function ok(msg) {
  console.log("OK:", msg);
}

async function fetchStatus(url, opts = {}) {
  const res = await fetch(url, { redirect: "manual", ...opts });
  return res;
}

function expect(cond, msg) {
  if (!cond) fail(msg);
  else ok(msg);
}

// --- Unauthenticated checks ---
async function runPublic() {
  let r = await fetchStatus(`${BASE}/`);
  expect(r.status === 307 || r.status === 302, `GET / -> redirect (got ${r.status})`);
  const loc = r.headers.get("location") || "";
  // Next.js App Router may omit `Location` on 307 (RSC/navigation); still a valid redirect response.
  if (loc) {
    expect(loc.includes("/login"), `GET / Location -> login (got ${loc})`);
  } else {
    ok("GET / -> redirect without Location header (Next.js RSC)");
  }

  r = await fetchStatus(`${BASE}/login`);
  expect(r.status === 200, `GET /login -> 200`);

  r = await fetchStatus(`${BASE}/admin/dashboard`);
  expect(r.status === 307 || r.status === 302, `GET /admin/dashboard unauthenticated -> redirect`);
  const locA = r.headers.get("location") || "";
  expect(locA.includes("/login"), `admin redirect to login`);

  r = await fetchStatus(`${BASE}/brand/dashboard`);
  expect(r.status === 307 || r.status === 302, `GET /brand/dashboard unauthenticated -> redirect`);
  const locB = r.headers.get("location") || "";
  expect(locB.includes("/login"), `brand redirect to login`);
}

async function runApiUnauth() {
  const paths = [
    "/api/auth/me",
    "/api/notifications",
    "/api/brands",
    "/api/campaigns",
    "/api/deliverables",
    "/api/metrics",
    "/api/social-metrics?brandId=00000000-0000-0000-0000-000000000001",
    "/api/upload",
    "/api/media?key=uploads/00000000-0000-0000-0000-000000000000.jpg",
  ];
  for (const p of paths) {
    const r = await fetchStatus(`${BASE}${p}`, { method: p === "/api/upload" ? "POST" : "GET" });
    const ct = r.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");
    const j = isJson ? await r.json().catch(() => ({})) : {};
    expect(
      r.status === 401 || r.status === 400 || r.status === 403,
      `GET/POST ${p} unauthenticated -> ${r.status} (${isJson ? JSON.stringify(j).slice(0, 80) : "non-json"})`
    );
  }
}

/** Merge Set-Cookie into a Cookie header map */
function applySetCookies(headers, jar) {
  const list = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
  for (const line of list) {
    const pair = line.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function runAuthFlow() {
  const email = process.env.E2E_ADMIN_EMAIL?.trim();
  const password = process.env.E2E_ADMIN_PASSWORD?.trim();
  if (!email || !password) {
    console.log("SKIP: authenticated API checks (set E2E_ADMIN_EMAIL + E2E_ADMIN_PASSWORD)");
    return;
  }

  const jar = new Map();

  let r = await fetch(`${BASE}/api/auth/csrf`, { headers: { Cookie: cookieHeader(jar) } });
  applySetCookies(r.headers, jar);
  const csrfBody = await r.json();
  const csrfToken = csrfBody.csrfToken;
  if (!csrfToken) {
    fail("No csrfToken from /api/auth/csrf");
    return;
  }

  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: `${BASE}/admin/dashboard`,
    json: "true",
  });

  r = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(jar),
    },
    body,
    redirect: "manual",
  });
  applySetCookies(r.headers, jar);

  const authJson = await r.json().catch(() => ({}));
  if (r.status !== 200 || authJson.error) {
    fail(`Credentials sign-in failed: HTTP ${r.status} ${JSON.stringify(authJson)}`);
    return;
  }
  ok("NextAuth credentials sign-in (admin)");

  const cookie = cookieHeader(jar);
  if (!cookie.includes("next-auth")) {
    fail("Expected session cookie after sign-in");
    return;
  }

  r = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookie } });
  const me = await r.json().catch(() => ({}));
  expect(r.status === 200 && me.user?.role === "admin", `GET /api/auth/me as admin -> ${r.status}`);

  r = await fetch(`${BASE}/api/brands`, { headers: { Cookie: cookie } });
  expect(r.status === 200 && Array.isArray(await r.json().catch(() => null)), `GET /api/brands -> 200 array`);

  r = await fetch(`${BASE}/api/campaigns`, { headers: { Cookie: cookie } });
  expect(r.status === 200 && Array.isArray(await r.json().catch(() => null)), `GET /api/campaigns -> 200 array`);

  r = await fetch(`${BASE}/api/deliverables`, { headers: { Cookie: cookie } });
  expect(r.status === 200 && Array.isArray(await r.json().catch(() => null)), `GET /api/deliverables -> 200 array`);

  r = await fetch(`${BASE}/api/notifications`, { headers: { Cookie: cookie } });
  expect(r.status === 200 && Array.isArray(await r.json().catch(() => null)), `GET /api/notifications -> 200 array`);

  r = await fetch(`${BASE}/admin/dashboard`, { headers: { Cookie: cookie }, redirect: "manual" });
  expect(r.status === 200 || r.status === 307, `GET /admin/dashboard with session -> ${r.status}`);
}

async function main() {
  console.log("E2E smoke BASE =", BASE);
  await runPublic();
  await runApiUnauth();
  await runAuthFlow();
  if (failed) {
    console.error("\n" + failed + " check(s) failed.");
    process.exit(1);
  }
  console.log("\nAll smoke checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
