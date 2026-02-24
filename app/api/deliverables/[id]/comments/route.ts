import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { db, comments, users, deliverables, campaigns, brands } from "@/lib/db";
import { createNotificationForAdmins } from "@/lib/notifications";

const postCommentSchema = z.object({ text: z.string().min(1) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  const { id: deliverableId } = await params;

  const [del] = await db
    .select({
      id: deliverables.id,
      name: deliverables.name,
      campaignId: deliverables.campaignId,
      brandId: campaigns.brandId,
    })
    .from(deliverables)
    .innerJoin(campaigns, eq(deliverables.campaignId, campaigns.id))
    .where(eq(deliverables.id, deliverableId))
    .limit(1);

  if (!del) {
    return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
  }
  if (user.role === "brand" && user.brandId && del.brandId !== user.brandId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = postCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [inserted] = await db
    .insert(comments)
    .values({
      deliverableId,
      userId: user.id,
      text: parsed.data.text,
    })
    .returning();

  const [author] = await db.select({ name: users.name }).from(users).where(eq(users.id, user.id)).limit(1);

  await createNotificationForAdmins({
    type: "new_comment",
    title: "New Comment",
    message: `New comment on ${del.name} by ${author?.name ?? user.email}`,
    deliverableId,
    campaignId: del.campaignId,
  });

  return NextResponse.json({
    id: inserted!.id,
    text: inserted!.text,
    author: author?.name ?? user.email,
    createdAt: inserted!.createdAt,
  });
}
