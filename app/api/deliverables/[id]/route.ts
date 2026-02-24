import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { updateDeliverableSchema } from "@/lib/validations/deliverables";
import {
  db,
  deliverables,
  campaigns,
  brands,
  deliverableFiles,
  comments,
  users,
  contentVersions,
  contentVersionFiles,
  revisions,
  revisionFiles,
} from "@/lib/db";
import { createNotificationForAdmins, createNotificationForUser } from "@/lib/notifications";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  const { id } = await params;

  const [del] = await db
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
    .where(eq(deliverables.id, id))
    .limit(1);

  if (!del) {
    return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
  }
  if (user.role === "brand" && user.brandId && del.brandId !== user.brandId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fileList = await db
    .select({ url: deliverableFiles.url })
    .from(deliverableFiles)
    .where(eq(deliverableFiles.deliverableId, id))
    .orderBy(asc(deliverableFiles.sortOrder));

  const commentRows = await db
    .select({
      id: comments.id,
      text: comments.text,
      author: users.name,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.deliverableId, id))
    .orderBy(asc(comments.createdAt));

  const versionRows = await db
    .select()
    .from(contentVersions)
    .where(eq(contentVersions.deliverableId, id))
    .orderBy(asc(contentVersions.createdAt));

  const revisionRows = await db
    .select()
    .from(revisions)
    .where(eq(revisions.deliverableId, id))
    .orderBy(asc(revisions.requestedAt));

  const contentHistory = [];
  for (const v of versionRows) {
    const vfiles = await db
      .select({ url: contentVersionFiles.url })
      .from(contentVersionFiles)
      .where(eq(contentVersionFiles.contentVersionId, v.id))
      .orderBy(asc(contentVersionFiles.sortOrder));
    const [uploader] = await db.select({ name: users.name }).from(users).where(eq(users.id, v.uploadedBy)).limit(1);
    contentHistory.push({
      id: v.id,
      files: vfiles.map((f) => f.url),
      uploadedAt: v.createdAt,
      uploadedBy: uploader?.name ?? "Unknown",
      revisionNote: v.revisionNote ?? undefined,
    });
  }

  const revisionsWithFiles = [];
  for (const r of revisionRows) {
    const rfiles = await db
      .select({ url: revisionFiles.url })
      .from(revisionFiles)
      .where(eq(revisionFiles.revisionId, r.id))
      .orderBy(asc(revisionFiles.sortOrder));
    const [reqBy] = await db.select({ name: users.name }).from(users).where(eq(users.id, r.requestedBy)).limit(1);
    revisionsWithFiles.push({
      id: r.id,
      deliverableId: r.deliverableId,
      revisionNote: r.revisionNote,
      requestedBy: reqBy?.name ?? "Unknown",
      requestedAt: r.requestedAt,
      files: rfiles.map((f) => f.url),
    });
  }

  return NextResponse.json({
    id: del.id,
    name: del.name,
    postType: del.postType,
    files: fileList.map((f) => f.url),
    caption: del.caption,
    postingDate: del.postingDate,
    postingTime: del.postingTime,
    liveLink: del.liveLink ?? undefined,
    campaignId: del.campaignId,
    campaignName: del.campaignName,
    brandId: del.brandId,
    brandName: del.brandName,
    status: del.status,
    comments: commentRows.map((c) => ({
      id: c.id,
      text: c.text,
      author: c.author ?? "Unknown",
      createdAt: c.createdAt,
    })),
    createdAt: del.createdAt,
    contentHistory,
    revisions: revisionsWithFiles,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  const { id } = await params;

  const [existing] = await db
    .select({
      deliverable: deliverables,
      brandId: brands.id,
    })
    .from(deliverables)
    .innerJoin(campaigns, eq(deliverables.campaignId, campaigns.id))
    .innerJoin(brands, eq(campaigns.brandId, brands.id))
    .where(eq(deliverables.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
  }
  if (user.role === "brand" && user.brandId && existing.brandId !== user.brandId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateDeliverableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const oldStatus = existing.deliverable.status;

  const updatePayload: Partial<typeof deliverables.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.postType !== undefined) updatePayload.postType = data.postType;
  if (data.caption !== undefined) updatePayload.caption = data.caption;
  if (data.postingDate !== undefined) updatePayload.postingDate = data.postingDate;
  if (data.postingTime !== undefined) updatePayload.postingTime = data.postingTime;
  if (data.liveLink !== undefined) updatePayload.liveLink = data.liveLink || null;
  if (data.status !== undefined) updatePayload.status = data.status as any;

  const [updated] = await db
    .update(deliverables)
    .set(updatePayload)
    .where(eq(deliverables.id, id))
    .returning();

  if (data.fileUrls !== undefined) {
    await db.delete(deliverableFiles).where(eq(deliverableFiles.deliverableId, id));
    for (let i = 0; i < data.fileUrls.length; i++) {
      await db.insert(deliverableFiles).values({
        deliverableId: id,
        url: data.fileUrls[i],
        sortOrder: i,
      });
    }
    // When admin updates files, record as content version (content history)
    if (user.role === "admin" && data.fileUrls.length > 0) {
      const [contentVersion] = await db
        .insert(contentVersions)
        .values({
          deliverableId: id,
          revisionNote: data.revisionNote ?? null,
          uploadedBy: user.id,
        })
        .returning();
      if (contentVersion) {
        for (let i = 0; i < data.fileUrls.length; i++) {
          await db.insert(contentVersionFiles).values({
            contentVersionId: contentVersion.id,
            url: data.fileUrls[i],
            sortOrder: i,
          });
        }
      }
    }
  }

  if (data.revisionNote && data.newFileUrls && data.newFileUrls.length > 0 && user.role === "brand") {
    const [rev] = await db
      .insert(revisions)
      .values({
        deliverableId: id,
        revisionNote: data.revisionNote,
        requestedBy: user.id,
      })
      .returning();
    if (rev) {
      for (let i = 0; i < data.newFileUrls.length; i++) {
        await db.insert(revisionFiles).values({
          revisionId: rev.id,
          url: data.newFileUrls[i],
          sortOrder: i,
        });
      }
    }
    await createNotificationForAdmins({
      type: "revision",
      title: "Content Revised",
      message: `Revision requested for ${updated?.name ?? id}`,
      deliverableId: id,
      campaignId: existing.deliverable.campaignId,
    });
  }

  if (data.status && data.status !== oldStatus) {
    await createNotificationForAdmins({
      type: "status_change",
      title: "Status Changed",
      message: `${updated?.name ?? id} status changed to ${data.status}`,
      deliverableId: id,
      campaignId: existing.deliverable.campaignId,
    });
  }

  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, updated!.campaignId)).limit(1);
  const [brand] = await db.select().from(brands).where(eq(brands.id, campaign!.brandId)).limit(1);
  const fileRows = await db.select({ url: deliverableFiles.url }).from(deliverableFiles).where(eq(deliverableFiles.deliverableId, id)).orderBy(deliverableFiles.sortOrder);

  return NextResponse.json({
    id: updated!.id,
    name: updated!.name,
    postType: updated!.postType,
    files: fileRows.map((f) => f.url),
    caption: updated!.caption,
    postingDate: updated!.postingDate,
    postingTime: updated!.postingTime,
    liveLink: updated!.liveLink ?? undefined,
    campaignId: updated!.campaignId,
    campaignName: campaign!.name,
    brandId: campaign!.brandId,
    brandName: brand!.name,
    status: updated!.status,
    comments: [],
    createdAt: updated!.createdAt,
    contentHistory: [],
    revisions: [],
  });
}
