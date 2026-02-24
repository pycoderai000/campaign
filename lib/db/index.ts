import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Use placeholder at build time so Next.js can collect page data without DATABASE_URL
const connectionString =
  process.env.DATABASE_URL || "postgresql://localhost:5432/placeholder?sslmode=disable";

const client = postgres(connectionString, {
  max: 10,
  prepare: false,
});

export const db = drizzle(client, { schema });
export * from "./schema";
