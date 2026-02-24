/**
 * One-time seed: creates an admin user and a brand + brand user.
 * Run from project root: node scripts/seed-users.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const bcrypt = require("bcryptjs");
const postgres = require("postgres");

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function seed() {
  const adminEmail = "admin@kaleidotechlabs.com";
  const adminPassword = "Admin123!";
  const brandUserEmail = "brand@kaleidotechlabs.com";
  const brandUserPassword = "Brand123!";

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const brandHash = await bcrypt.hash(brandUserPassword, 10);

  await sql`
    INSERT INTO users (id, email, hashed_password, role, name, created_at, updated_at)
    VALUES (gen_random_uuid(), ${adminEmail}, ${adminHash}, 'admin', 'Admin', now(), now())
    ON CONFLICT (email) DO NOTHING
  `;
  console.log("Admin user:", adminEmail, "(already exists or created)");

  const brands = await sql`
    INSERT INTO brands (id, name, poc, email, contact_number, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Demo Brand', 'Demo Contact', 'brand@kaleidotechlabs.com', '+1234567890', now(), now())
    ON CONFLICT DO NOTHING
    RETURNING id
  `;
  let brandId = null;
  if (brands.length > 0) {
    brandId = brands[0].id;
    console.log("Brand created:", brandId);
  } else {
    const existing = await sql`SELECT id FROM brands LIMIT 1`;
    if (existing.length > 0) brandId = existing[0].id;
  }

  if (brandId) {
    await sql`
      INSERT INTO users (id, email, hashed_password, role, brand_id, name, created_at, updated_at)
      VALUES (gen_random_uuid(), ${brandUserEmail}, ${brandHash}, 'brand', ${brandId}, 'Brand User', now(), now())
      ON CONFLICT (email) DO NOTHING
    `;
    console.log("Brand user:", brandUserEmail, "(already exists or created)");
  }

  console.log("\n--- Login credentials ---");
  console.log("Admin:  ", adminEmail, " / ", adminPassword);
  console.log("Brand:  ", brandUserEmail, " / ", brandUserPassword);
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => sql.end());
