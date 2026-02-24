import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getInstagramBusinessAccountId } from "@/lib/meta-graph";

/**
 * GET /api/sync/instagram/status
 * Admin only. Returns whether Meta env is configured and if the Page has Instagram Business linked.
 * Does not expose any secrets.
 */
export async function GET() {
  await requireAuth("admin");

  const pageId = process.env.META_PAGE_ID;
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!pageId || !token) {
    return NextResponse.json({
      configured: false,
      hasInstagram: false,
      message: "Add META_PAGE_ID and META_PAGE_ACCESS_TOKEN to .env",
    });
  }

  if (!appId || !appSecret) {
    return NextResponse.json({
      configured: false,
      hasInstagram: false,
      message: "Add META_APP_ID and META_APP_SECRET to .env",
    });
  }

  try {
    const igId = await getInstagramBusinessAccountId();
    if (igId) {
      return NextResponse.json({
        configured: true,
        hasInstagram: true,
        message: "Meta connected. Instagram Business account linked. You can sync metrics.",
      });
    }
    return NextResponse.json({
      configured: true,
      hasInstagram: false,
      message:
        "Meta credentials valid, but this Facebook Page has no Instagram Business account linked. Link an IG Business/Creator account to the Page in Meta Business Suite or Facebook Page Settings.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Meta API error";
    return NextResponse.json({
      configured: true,
      hasInstagram: false,
      message: `Meta API error: ${message}. Check token and permissions.`,
    });
  }
}
