#!/usr/bin/env node
import { config } from "dotenv";

config({ path: ".env.local", override: true, quiet: true });
config({ path: ".env", override: false, quiet: true });

const base =
  (process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const cronSecret = process.env.CRON_SECRET?.trim();

if (!cronSecret) {
  console.error("CRON_SECRET is required to run brand monitoring sync.");
  process.exit(1);
}

const response = await fetch(`${base}/api/monitoring`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-cron-secret": cronSecret,
  },
  body: JSON.stringify({ dueOnly: true }),
});

const text = await response.text();
if (!response.ok) {
  console.error(`Monitoring sync failed: ${response.status} ${text}`);
  process.exit(1);
}

console.log(text);
