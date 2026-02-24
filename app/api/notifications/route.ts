import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db, notifications } from "@/lib/db";

export async function GET(request: Request) {
  const user = await requireAuth();
  const { searchParams } = new URL(request.url);
  const readParam = searchParams.get("read");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Number(searchParams.get("offset")) || 0;

  let query = db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  const rows = await query;
  const filtered =
    readParam === "true"
      ? rows.filter((r) => r.read)
      : readParam === "false"
        ? rows.filter((r) => !r.read)
        : rows;

  return NextResponse.json(
    filtered.map((n) => ({
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
