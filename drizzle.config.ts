import { config } from "dotenv";
// Load .env.local first (Next.js), then .env
config({ path: ".env.local" });
config();
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
