import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createCampaignSchema } from "@/lib/validations/campaigns";
import { db, campaigns, brands } from "@/lib/db";

export async function GET() {
  const user = await requireAuth();
  const all = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      type: campaigns.type,
      brandId: campaigns.brandId,
      brandName: brands.name,
      createdAt: campaigns.createdAt,
    })
    .from(campaigns)
    .innerJoin(brands, eq(campaigns.brandId, brands.id))
    .orderBy(desc(campaigns.createdAt));

  if (user.role === "brand" && user.brandId) {
    const filtered = all.filter((c) => c.brandId === user.brandId);
    return NextResponse.json(filtered);
  }
  return NextResponse.json(all);
}

export async function POST(request: Request) {
  await requireAuth("admin");
  const body = await request.json();
  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { name, type, brandId } = parsed.data;
  const [inserted] = await db.insert(campaigns).values({ name, type, brandId }).returning();
  const [brand] = await db.select({ name: brands.name }).from(brands).where(eq(brands.id, brandId)).limit(1);
  return NextResponse.json({
    id: inserted.id,
    name: inserted.name,
    type: inserted.type,
    brandId: inserted.brandId,
    brandName: brand?.name ?? "",
    createdAt: inserted.createdAt,
  });
}
