#!/usr/bin/env node
import { config } from "dotenv";

config({ path: ".env", override: true });

const BASE = (process.env.E2E_BASE_URL || process.env.NEXTAUTH_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const email = process.env.E2E_BRAND_EMAIL?.trim();
const password = process.env.E2E_BRAND_PASSWORD?.trim();

let failed = 0;

function ok(msg) {
  console.log("OK:", msg);
}

function fail(msg) {
  console.error("FAIL:", msg);
  failed++;
}

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

async function main() {
  if (!email || !password) {
    fail("Set E2E_BRAND_EMAIL and E2E_BRAND_PASSWORD");
    process.exit(1);
  }

  const jar = new Map();

  let r = await fetch(`${BASE}/api/auth/csrf`, {
    headers: { Cookie: cookieHeader(jar) },
  });
  applySetCookies(r.headers, jar);
  const csrf = await r.json().catch(() => ({}));
  if (!csrf.csrfToken) {
    fail("No CSRF token returned");
    process.exit(1);
  }
  ok("Fetched CSRF token");

  const body = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    email,
    password,
    callbackUrl: `${BASE}/brand/dashboard`,
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
  const auth = await r.json().catch(() => ({}));
  if (r.status !== 200 || auth.error) {
    fail(`Brand sign-in failed: HTTP ${r.status} ${JSON.stringify(auth)}`);
    process.exit(1);
  }
  ok("Brand credentials sign-in");

  const cookie = cookieHeader(jar);

  r = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookie } });
  const me = await r.json().catch(() => ({}));
  if (r.status !== 200 || me.user?.role !== "brand") {
    fail(`GET /api/auth/me expected brand session, got ${r.status} ${JSON.stringify(me)}`);
  } else {
    ok(`Brand session active for ${me.user.email}`);
  }

  r = await fetch(`${BASE}/brand/dashboard`, {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  if (r.status !== 200) {
    fail(`GET /brand/dashboard expected 200, got ${r.status}`);
  } else {
    ok("Brand dashboard route loads");
  }

  r = await fetch(`${BASE}/api/monitoring`, { headers: { Cookie: cookie } });
  const monitoring = await r.json().catch(() => ({}));
  if (r.status !== 200 || !Array.isArray(monitoring.items)) {
    fail(`GET /api/monitoring expected 200 with items[], got ${r.status} ${JSON.stringify(monitoring)}`);
  } else {
    ok(`Brand monitoring API returned ${monitoring.items.length} item(s)`);
    const titles = monitoring.items.slice(0, 3).map((item) => item.title).filter(Boolean);
    if (titles.length === 0) {
      fail("Monitoring API returned no item titles");
    } else {
      ok(`Sample titles: ${titles.join(" | ")}`);
    }
  }

  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
