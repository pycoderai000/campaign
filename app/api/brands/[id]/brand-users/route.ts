import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth";
import { db, brands, users } from "@/lib/db";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().max(255).optional(),
});

/**
 * Admin: create a brand-portal login for an existing brand (no user yet, or additional email).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("admin");
  if (auth instanceof NextResponse) return auth;
  const { id: brandId } = await params;

  const [brand] = await db.select({ id: brands.id }).from(brands).where(eq(brands.id, brandId)).limit(1);
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { email, password, name } = parsed.data;

  const [dup] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (dup) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const [inserted] = await db
    .insert(users)
    .values({
      email,
      hashedPassword,
      role: "brand",
      brandId,
      name: name ?? null,
    })
    .returning();

  return NextResponse.json({
    user: {
      id: inserted!.id,
      email: inserted!.email,
      role: inserted!.role,
      brandId: inserted!.brandId,
      name: inserted!.name,
    },
  });
}
