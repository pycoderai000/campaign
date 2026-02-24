import { NextResponse } from "next/server";
import { desc, eq, and, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { createDeliverablesBulkSchema } from "@/lib/validations/deliverables";
import {
  db,
  deliverables,
  campaigns,
  brands,
  deliverableFiles,
} from "@/lib/db";
import { createNotificationForAdmins } from "@/lib/notifications";

export async function GET(request: Request) {
  const user = await requireAuth();
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId") ?? undefined;
  const brandId = searchParams.get("brandId") ?? undefined;
  const statusParam = searchParams.get("status") ?? undefined;

  const conditions = [];
  if (campaignId) conditions.push(eq(deliverables.campaignId, campaignId));
  if (brandId) conditions.push(eq(campaigns.brandId, brandId));
  if (statusParam) conditions.push(eq(deliverables.status, statusParam as any));
  if (user.role === "brand" && user.brandId) {
    conditions.push(eq(campaigns.brandId, user.brandId));
  }

  const rows =
    conditions.length > 0
      ? await db
          .select({
            id: deliverables.id,
            name: deliverables.name,
            postType: deliverables.postType,
            caption: deliverables.caption,
            postingDate: deliverables.postingDate,
            postingTime: deliverables.postingTime,
            liveLink: deliverables.liveLink,
            campaignId: deliverables.campaignId,
            campaignName: campaigns.name,
            brandId: brands.id,
            brandName: brands.name,
            status: deliverables.status,
            createdAt: deliverables.createdAt,
          })
          .from(deliverables)
          .innerJoin(campaigns, eq(deliverables.campaignId, campaigns.id))
          .innerJoin(brands, eq(campaigns.brandId, brands.id))
          .where(and(...conditions))
          .orderBy(desc(deliverables.createdAt))
      : await db
          .select({
            id: deliverables.id,
            name: deliverables.name,
            postType: deliverables.postType,
            caption: deliverables.caption,
            postingDate: deliverables.postingDate,
            postingTime: deliverables.postingTime,
            liveLink: deliverables.liveLink,
            campaignId: deliverables.campaignId,
            campaignName: campaigns.name,
            brandId: brands.id,
            brandName: brands.name,
            status: deliverables.status,
            createdAt: deliverables.createdAt,
          })
          .from(deliverables)
          .innerJoin(campaigns, eq(deliverables.campaignId, campaigns.id))
          .innerJoin(brands, eq(campaigns.brandId, brands.id))
          .orderBy(desc(deliverables.createdAt));

  const ids = rows.map((r) => r.id);
  const filesByDeliverable =
    ids.length > 0
      ? await db
          .select({ deliverableId: deliverableFiles.deliverableId, url: deliverableFiles.url, sortOrder: deliverableFiles.sortOrder })
          .from(deliverableFiles)
          .where(inArray(deliverableFiles.deliverableId, ids))
      : [];

  const fileMap = new Map<string, string[]>();
  for (const f of filesByDeliverable) {
    const arr = fileMap.get(f.deliverableId) ?? [];
    arr.push(f.url);
    fileMap.set(f.deliverableId, arr);
  }

  const list = rows.map((r) => ({
    id: r.id,
    name: r.name,
    postType: r.postType,
    files: fileMap.get(r.id) ?? [],
    caption: r.caption,
    postingDate: r.postingDate,
    postingTime: r.postingTime,
    liveLink: r.liveLink ?? undefined,
    campaignId: r.campaignId,
    campaignName: r.campaignName,
    brandId: r.brandId,
    brandName: r.brandName,
    status: r.status,
    comments: [],
    createdAt: r.createdAt,
    contentHistory: [],
    revisions: [],
  }));

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  await requireAuth("admin");
  const body = await request.json();
  const parsed = createDeliverablesBulkSchema.safeParse(Array.isArray(body) ? body : [body]);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const items = parsed.data;
  const created: any[] = [];

  for (const item of items) {
    const [campaign] = await db
      .select({ id: campaigns.id, name: campaigns.name, brandId: campaigns.brandId })
      .from(campaigns)
      .where(eq(campaigns.id, item.campaignId))
      .limit(1);
    if (!campaign) continue;

    const [brand] = await db
      .select({ name: brands.name })
      .from(brands)
      .where(eq(brands.id, campaign.brandId))
      .limit(1);

    const [del] = await db
      .insert(deliverables)
      .values({
        name: item.name,
        postType: item.postType,
        caption: item.caption,
        postingDate: item.postingDate,
        postingTime: item.postingTime,
        liveLink: item.liveLink || null,
        campaignId: item.campaignId,
        status: item.status,
      })
      .returning();

    if (!del) continue;

    for (let i = 0; i < (item.fileUrls ?? []).length; i++) {
      await db.insert(deliverableFiles).values({
        deliverableId: del.id,
        url: item.fileUrls![i],
        sortOrder: i,
      });
    }

    await createNotificationForAdmins({
      type: "new_content",
      title: "New Content Uploaded",
      message: `New content uploaded for ${item.name}`,
      deliverableId: del.id,
      campaignId: del.campaignId,
    });

    created.push({
      id: del.id,
      name: del.name,
      postType: del.postType,
      files: item.fileUrls ?? [],
      caption: del.caption,
      postingDate: del.postingDate,
      postingTime: del.postingTime,
      liveLink: del.liveLink ?? undefined,
      campaignId: del.campaignId,
      campaignName: campaign.name,
      brandId: campaign.brandId,
      brandName: brand?.name ?? "",
      status: del.status,
      comments: [],
      createdAt: del.createdAt,
      contentHistory: [],
      revisions: [],
    });
  }

  return NextResponse.json(Array.isArray(body) ? created : created[0] ?? null);
}
