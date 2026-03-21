/**
 * One-off script to verify Meta Graph API env and access.
 * Run: node scripts/check-meta.js (from project root, with .env present)
 * Does not print secrets.
 * Sync only requires META_PAGE_ID + META_PAGE_ACCESS_TOKEN (same as the app).
 */
require("dotenv").config({ path: ".env" });

const VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${VERSION}`;

function check() {
  const pageId = process.env.META_PAGE_ID;
  const token = process.env.META_PAGE_ACCESS_TOKEN;

  if (!pageId || !token) {
    console.log("META env: MISSING");
    if (!pageId) console.log("  - META_PAGE_ID not set or empty");
    if (!token) console.log("  - META_PAGE_ACCESS_TOKEN not set or empty");
    process.exit(1);
  }
  console.log("META env: OK (META_PAGE_ID + META_PAGE_ACCESS_TOKEN)");
  console.log("Using Graph API:", VERSION);

  const url = `${BASE}/${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(token)}`;
  return fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        console.log("Page access: FAILED");
        console.log("  Error:", data.error.message || JSON.stringify(data.error));
        if (data.error.code) console.log("  Code:", data.error.code);
        process.exit(1);
      }
      console.log("Page access: OK");
      const ig = data.instagram_business_account;
      if (ig && ig.id) {
        console.log("Instagram Business: LINKED (id:", ig.id + ")");
        return ig.id;
      }
      console.log("Instagram Business: NOT LINKED — connect an Instagram Business account to this Facebook Page.");
      process.exit(0);
    })
    .then((igId) => {
      if (!igId) return;
      const url2 = `${BASE}/${igId}?fields=followers_count,username&access_token=${encodeURIComponent(token)}`;
      return fetch(url2).then((r) => r.json());
    })
    .then((data) => {
      if (data && data.error) {
        console.log("Instagram profile: FAILED -", data.error.message);
        return;
      }
      if (data && typeof data.followers_count !== "undefined") {
        console.log(
          "Instagram profile: OK (followers:",
          data.followers_count + ", username:",
          (data.username || "n/a") + ")"
        );
      }
    })
    .catch((err) => {
      console.log("Request failed:", err.message);
      process.exit(1);
    });
}

check();
