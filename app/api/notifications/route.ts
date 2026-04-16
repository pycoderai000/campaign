import { NextResponse } from "next/server";
import { desc, eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db, notifications } from "@/lib/db";

export async function GET(request: Request) {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;
  const { searchParams } = new URL(request.url);
  const readParam = searchParams.get("read");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Number(searchParams.get("offset")) || 0;

  const conditions = [eq(notifications.userId, user.id)];
  if (readParam === "true") conditions.push(eq(notifications.read, true));
  if (readParam === "false") conditions.push(eq(notifications.read, false));

  const rows = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json(
    rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      deliverableId: n.deliverableId ?? "",
      campaignId: n.campaignId ?? undefined,
      createdAt: n.createdAt,
      read: n.read,
    }))
  );
}
