import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import bcrypt from "bcryptjs";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(["admin", "brand"]),
  brandId: z.string().uuid().optional(),
});

/** Register a new user. If no users exist, first registration is always admin. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { email, password, name, role, brandId } = parsed.data;

    const existing = await db.select().from(users).limit(1);
    const isFirstUser = existing.length === 0;
    const finalRole = isFirstUser ? "admin" : role;

    if (!isFirstUser) {
      const [dup] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (dup) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
    }

    if (finalRole === "brand" && !brandId) {
      return NextResponse.json(
        { error: "brandId required for brand users" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [inserted] = await db
      .insert(users)
      .values({
        email,
        hashedPassword,
        role: finalRole,
        brandId: finalRole === "brand" ? brandId : null,
        name: name ?? null,
      })
      .returning();

    if (!inserted) {
      return NextResponse.json({ error: "Registration failed" }, { status: 500 });
    }
    return NextResponse.json({
      user: {
        id: inserted.id,
        email: inserted.email,
        role: inserted.role,
        brandId: inserted.brandId,
        name: inserted.name,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
