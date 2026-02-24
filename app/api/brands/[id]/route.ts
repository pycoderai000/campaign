import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { updateBrandSchema } from "@/lib/validations/brands";
import { db, brands } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth("admin");
  const { id } = await params;
  const [row] = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
  if (!row) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: row.id,
    name: row.name,
    poc: row.poc,
    email: row.email,
    contactNumber: row.contactNumber,
    instagramLink: row.instagramLink ?? undefined,
    instagramHandle: row.instagramHandle ?? undefined,
    youtubeLink: row.youtubeLink ?? undefined,
    youtubeHandle: row.youtubeHandle ?? undefined,
    tiktokLink: row.tiktokLink ?? undefined,
    tiktokHandle: row.tiktokHandle ?? undefined,
    createdAt: row.createdAt,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth("admin");
  const { id } = await params;
  const body = await request.json();
  const parsed = updateBrandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const [updated] = await db
    .update(brands)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.poc !== undefined && { poc: data.poc }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.contactNumber !== undefined && { contactNumber: data.contactNumber }),
      ...(data.instagramLink !== undefined && { instagramLink: data.instagramLink || null }),
      ...(data.instagramHandle !== undefined && { instagramHandle: data.instagramHandle || null }),
      ...(data.youtubeLink !== undefined && { youtubeLink: data.youtubeLink || null }),
      ...(data.youtubeHandle !== undefined && { youtubeHandle: data.youtubeHandle || null }),
      ...(data.tiktokLink !== undefined && { tiktokLink: data.tiktokLink || null }),
      ...(data.tiktokHandle !== undefined && { tiktokHandle: data.tiktokHandle || null }),
      updatedAt: new Date(),
    })
    .where(eq(brands.id, id))
    .returning();
  if (!updated) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    poc: updated.poc,
    email: updated.email,
    contactNumber: updated.contactNumber,
    instagramLink: updated.instagramLink ?? undefined,
    instagramHandle: updated.instagramHandle ?? undefined,
    youtubeLink: updated.youtubeLink ?? undefined,
    youtubeHandle: updated.youtubeHandle ?? undefined,
    tiktokLink: updated.tiktokLink ?? undefined,
    tiktokHandle: updated.tiktokHandle ?? undefined,
    createdAt: updated.createdAt,
  });
}
