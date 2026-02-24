import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createBrandSchema } from "@/lib/validations/brands";
import { db, brands } from "@/lib/db";

export async function GET() {
  await requireAuth("admin");
  const list = await db.select().from(brands).orderBy(desc(brands.createdAt));
  return NextResponse.json(
    list.map((b) => ({
      id: b.id,
      name: b.name,
      poc: b.poc,
      email: b.email,
      contactNumber: b.contactNumber,
      instagramLink: b.instagramLink ?? undefined,
      instagramHandle: b.instagramHandle ?? undefined,
      youtubeLink: b.youtubeLink ?? undefined,
      youtubeHandle: b.youtubeHandle ?? undefined,
      tiktokLink: b.tiktokLink ?? undefined,
      tiktokHandle: b.tiktokHandle ?? undefined,
      createdAt: b.createdAt,
    }))
  );
}

export async function POST(request: Request) {
  await requireAuth("admin");
  const body = await request.json();
  const parsed = createBrandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const [inserted] = await db
    .insert(brands)
    .values({
      name: data.name,
      poc: data.poc,
      email: data.email,
      contactNumber: data.contactNumber,
      instagramLink: data.instagramLink || null,
      instagramHandle: data.instagramHandle || null,
      youtubeLink: data.youtubeLink || null,
      youtubeHandle: data.youtubeHandle || null,
      tiktokLink: data.tiktokLink || null,
      tiktokHandle: data.tiktokHandle || null,
    })
    .returning();
  return NextResponse.json({
    id: inserted.id,
    name: inserted.name,
    poc: inserted.poc,
    email: inserted.email,
    contactNumber: inserted.contactNumber,
    instagramLink: inserted.instagramLink ?? undefined,
    instagramHandle: inserted.instagramHandle ?? undefined,
    youtubeLink: inserted.youtubeLink ?? undefined,
    youtubeHandle: inserted.youtubeHandle ?? undefined,
    tiktokLink: inserted.tiktokLink ?? undefined,
    tiktokHandle: inserted.tiktokHandle ?? undefined,
    createdAt: inserted.createdAt,
  });
}
