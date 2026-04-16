import { and, eq } from "drizzle-orm";
import { db, notifications, users } from "@/lib/db";

type NotificationType = "new_content" | "status_change" | "new_comment" | "revision";

export async function createNotificationForBrandUsers(params: {
  brandId: string;
  type: NotificationType;
  title: string;
  message: string;
  deliverableId: string;
  campaignId?: string | null;
}) {
  const { brandId, type, title, message, deliverableId, campaignId } = params;
  const brandUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "brand"), eq(users.brandId, brandId)));
  if (brandUsers.length === 0) return;
  await db.insert(notifications).values(
    brandUsers.map((u) => ({
      userId: u.id,
      type,
      title,
      message,
      deliverableId,
      campaignId: campaignId ?? null,
    }))
  );
}

export async function createNotificationForAdmins(params: {
  type: NotificationType;
  title: string;
  message: string;
  deliverableId: string;
  campaignId?: string | null;
}) {
  const { type, title, message, deliverableId, campaignId } = params;
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  if (admins.length === 0) return;
  await db.insert(notifications).values(
    admins.map((a) => ({
      userId: a.id,
      type,
      title,
      message,
      deliverableId,
      campaignId: campaignId ?? null,
    }))
  );
}

export async function createNotificationForUser(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  deliverableId: string;
  campaignId?: string | null;
}) {
  const { userId, type, title, message, deliverableId, campaignId } = params;
  await db.insert(notifications).values({
    userId,
    type,
    title,
    message,
    deliverableId,
    campaignId: campaignId ?? null,
  });
}
