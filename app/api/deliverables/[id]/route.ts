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
import { createNotificationForAdmins, createNotificationForBrandUsers } from "@/lib/notifications";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;
  const { id } = await params;

  const [del] = await db
    .select({
      id: deliverables.id,
      name: deliverables.name,
      postType: deliverables.postType,
      contentBucket: deliverables.contentBucket,
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
    contentBucket: del.contentBucket ?? undefined,
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
  if (user instanceof NextResponse) return user;
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

  if (user.role === "brand") {
    const forbidden =
      data.name !== undefined ||
      data.postType !== undefined ||
      data.contentBucket !== undefined ||
      data.liveLink !== undefined ||
      data.fileUrls !== undefined;
    if (forbidden) {
      return NextResponse.json(
        { error: "Brands can only update caption, schedule, status, and revision requests" },
        { status: 403 }
      );
    }
  }

  const updatePayload: Partial<typeof deliverables.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.postType !== undefined) updatePayload.postType = data.postType;
  if (data.contentBucket !== undefined) updatePayload.contentBucket = data.contentBucket || null;
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
    const oldFileRows = await db
      .select({ url: deliverableFiles.url })
      .from(deliverableFiles)
      .where(eq(deliverableFiles.deliverableId, id))
      .orderBy(asc(deliverableFiles.sortOrder));
    const oldUrls = oldFileRows.map((r) => r.url);
    const newUrls = data.fileUrls;
    const filesChanged =
      oldUrls.length !== newUrls.length ||
      oldUrls.some((u, i) => u !== newUrls[i]);

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
        if (filesChanged) {
          await createNotificationForBrandUsers({
            brandId: existing.brandId,
            type: "new_content",
            title: "Content updated",
            message: `Files were updated for ${updated?.name ?? id}`,
            deliverableId: id,
            campaignId: existing.deliverable.campaignId,
          });
        }
      }
    }
  }

  if (data.revisionNote && data.revisionNote.trim() && user.role === "brand") {
    const note = data.revisionNote.trim();
    const urls = (data.newFileUrls ?? []).filter(Boolean);
    const [rev] = await db
      .insert(revisions)
      .values({
        deliverableId: id,
        revisionNote: note,
        requestedBy: user.id,
      })
      .returning();
    if (rev) {
      for (let i = 0; i < urls.length; i++) {
        await db.insert(revisionFiles).values({
          revisionId: rev.id,
          url: urls[i],
          sortOrder: i,
        });
      }
    }
    await createNotificationForAdmins({
      type: "revision",
      title: "Revision requested",
      message: `Revision requested for ${updated?.name ?? id}`,
      deliverableId: id,
      campaignId: existing.deliverable.campaignId,
    });
    if (data.status === undefined) {
      await db
        .update(deliverables)
        .set({ status: "In revision", updatedAt: new Date() })
        .where(eq(deliverables.id, id));
    }
  }

  if (data.status && data.status !== oldStatus) {
    if (user.role === "brand") {
      await createNotificationForAdmins({
        type: "status_change",
        title: "Status Changed",
        message: `${updated?.name ?? id} status changed to ${data.status}`,
        deliverableId: id,
        campaignId: existing.deliverable.campaignId,
      });
    } else if (user.role === "admin") {
      await createNotificationForBrandUsers({
        brandId: existing.brandId,
        type: "status_change",
        title: "Status updated",
        message: `${updated?.name ?? id} is now ${data.status}`,
        deliverableId: id,
        campaignId: existing.deliverable.campaignId,
      });
    }
  }

  const [latestRow] = await db.select().from(deliverables).where(eq(deliverables.id, id)).limit(1);
  const out = latestRow ?? updated!;

  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, out.campaignId)).limit(1);
  const [brand] = await db.select().from(brands).where(eq(brands.id, campaign!.brandId)).limit(1);
  const fileRows = await db.select({ url: deliverableFiles.url }).from(deliverableFiles).where(eq(deliverableFiles.deliverableId, id)).orderBy(deliverableFiles.sortOrder);

  return NextResponse.json({
    id: out.id,
    name: out.name,
    postType: out.postType,
    contentBucket: out.contentBucket ?? undefined,
    files: fileRows.map((f) => f.url),
    caption: out.caption,
    postingDate: out.postingDate,
    postingTime: out.postingTime,
    liveLink: out.liveLink ?? undefined,
    campaignId: out.campaignId,
    campaignName: campaign!.name,
    brandId: campaign!.brandId,
    brandName: brand!.name,
    status: out.status,
    comments: [],
    createdAt: out.createdAt,
    contentHistory: [],
    revisions: [],
  });
}
