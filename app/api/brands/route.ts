import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth";
import { createBrandSchema } from "@/lib/validations/brands";
import { db, brands, brandContentBuckets, users } from "@/lib/db";

function normalizeBuckets(input: { contentBucket?: string; contentBuckets?: string[] }): string[] {
  const fromArray = (input.contentBuckets || []).map((s) => s.trim()).filter(Boolean);
  const legacy = (input.contentBucket || "").trim();
  const merged = legacy ? [legacy, ...fromArray] : fromArray;
  return [...new Set(merged)];
}

export async function GET() {
  const auth = await requireAuth("admin");
  if (auth instanceof NextResponse) return auth;
  const list = await db.select().from(brands).orderBy(desc(brands.createdAt));
  const ids = list.map((b) => b.id);
  const bucketRows =
    ids.length > 0
      ? await db
          .select({ brandId: brandContentBuckets.brandId, name: brandContentBuckets.name })
          .from(brandContentBuckets)
          .where(inArray(brandContentBuckets.brandId, ids))
      : [];
  const bucketMap = new Map<string, string[]>();
  for (const row of bucketRows) {
    const arr = bucketMap.get(row.brandId) ?? [];
    arr.push(row.name);
    bucketMap.set(row.brandId, arr);
  }
  return NextResponse.json(
    list.map((b) => ({
      id: b.id,
      name: b.name,
      poc: b.poc,
      email: b.email,
      contactNumber: b.contactNumber,
      contentBucket: b.contentBucket ?? undefined,
      contentBuckets: bucketMap.get(b.id) ?? (b.contentBucket ? [b.contentBucket] : []),
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
  const auth = await requireAuth("admin");
  if (auth instanceof NextResponse) return auth;
  const body = await request.json();
  const parsed = createBrandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const contentBuckets = normalizeBuckets(data);
  const portalEmail = (data.portalLoginEmail ?? "").trim();
  const portalPassword = (data.portalLoginPassword ?? "").trim();
  const wantsPortal = Boolean(portalEmail && portalPassword);

  if (wantsPortal) {
    const [dup] = await db.select({ id: users.id }).from(users).where(eq(users.email, portalEmail)).limit(1);
    if (dup) {
      return NextResponse.json(
        { error: "That portal login email is already registered. Use a different email or remove portal login fields." },
        { status: 409 }
      );
    }
  }

  const inserted = await db.transaction(async (tx) => {
    const [b] = await tx
      .insert(brands)
      .values({
        name: data.name,
        poc: data.poc,
        email: data.email,
        contactNumber: data.contactNumber,
        contentBucket: contentBuckets[0] || null,
        instagramLink: data.instagramLink || null,
        instagramHandle: data.instagramHandle || null,
        youtubeLink: data.youtubeLink || null,
        youtubeHandle: data.youtubeHandle || null,
        tiktokLink: data.tiktokLink || null,
        tiktokHandle: data.tiktokHandle || null,
      })
      .returning();

    if (!b) throw new Error("Insert failed");

    if (contentBuckets.length > 0) {
      await tx.insert(brandContentBuckets).values(
        contentBuckets.map((name) => ({
          brandId: b.id,
          name,
        }))
      );
    }

    if (wantsPortal) {
      const hashedPassword = await bcrypt.hash(portalPassword, 10);
      await tx.insert(users).values({
        email: portalEmail,
        hashedPassword,
        role: "brand",
        brandId: b.id,
        name: data.poc ?? null,
      });
    }

    return b;
  });

  return NextResponse.json({
    id: inserted.id,
    name: inserted.name,
    poc: inserted.poc,
    email: inserted.email,
    contactNumber: inserted.contactNumber,
    contentBucket: inserted.contentBucket ?? undefined,
    contentBuckets,
    instagramLink: inserted.instagramLink ?? undefined,
    instagramHandle: inserted.instagramHandle ?? undefined,
    youtubeLink: inserted.youtubeLink ?? undefined,
    youtubeHandle: inserted.youtubeHandle ?? undefined,
    tiktokLink: inserted.tiktokLink ?? undefined,
    tiktokHandle: inserted.tiktokHandle ?? undefined,
    createdAt: inserted.createdAt,
    portalUserCreated: wantsPortal,
  });
}
