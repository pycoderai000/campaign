#!/usr/bin/env node
/**
 * Deployment smoke checks: S3 bucket reachability, local HTTP, anonymous read on uploads/.
 * Run from repo root: node scripts/verify-e2e.mjs
 */
import { config } from "dotenv";
import { spawnSync } from "child_process";
// Prefer .env over any inherited shell AWS_* (avoid SignatureDoesNotMatch)
config({ path: ".env", override: true });

const bucket = process.env.S3_BUCKET;
const region = process.env.AWS_REGION || "us-east-1";
let failed = 0;

function ok(msg) {
  console.log("OK:", msg);
}
function fail(msg) {
  console.error("FAIL:", msg);
  failed++;
}

if (!bucket) {
  fail("S3_BUCKET not set in .env");
  process.exit(1);
}

const env = {
  ...process.env,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_DEFAULT_REGION: region,
};
delete env.AWS_SESSION_TOKEN;
const id = spawnSync("aws", ["sts", "get-caller-identity"], { env, encoding: "utf8" });
if (id.status !== 0) {
  fail("aws sts get-caller-identity: " + (id.stderr || id.stdout));
} else {
  ok("AWS credentials (get-caller-identity)");
}

const hb = spawnSync(
  "aws",
  ["s3api", "head-bucket", "--bucket", bucket],
  { env, encoding: "utf8" }
);
if (hb.status !== 0) {
  fail("head-bucket: " + (hb.stderr || hb.stdout));
} else {
  ok(`S3 bucket reachable: ${bucket}`);
}

const curl = (args) => {
  const r = spawnSync("curl", args, { encoding: "utf8" });
  return { code: r.status, out: r.stdout };
};

const login = curl(["-sS", "-o", "/dev/null", "-w", "%{http_code}", "http://127.0.0.1:3000/login"]);
if (login.out !== "200") {
  fail(`GET /login expected 200, got ${login.out}`);
} else {
  ok("HTTP GET /login -> 200");
}

const media = curl(["-sS", "-o", "/dev/null", "-w", "%{http_code}", "http://127.0.0.1:3000/api/media?key=uploads/x"]);
if (media.out !== "401") {
  fail(`GET /api/media unauthenticated expected 401, got ${media.out}`);
} else {
  ok("HTTP GET /api/media (no session) -> 401");
}

process.exit(failed ? 1 : 0);
