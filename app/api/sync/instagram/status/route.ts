import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getInstagramBusinessAccountId } from "@/lib/meta-graph";

/**
 * GET /api/sync/instagram/status
 * Admin only. Returns whether Meta env is configured and if the Page has Instagram Business linked.
 * Sync only needs META_PAGE_ID + META_PAGE_ACCESS_TOKEN (same as lib/meta-graph).
 */
export async function GET() {
  const auth = await requireAuth("admin");
  if (auth instanceof NextResponse) return auth;

  const pageId = process.env.META_PAGE_ID;
  const token = process.env.META_PAGE_ACCESS_TOKEN;

  if (!pageId || !token) {
    return NextResponse.json({
      configured: false,
      hasInstagram: false,
      message: "Add META_PAGE_ID and META_PAGE_ACCESS_TOKEN to the server environment.",
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
        "Meta credentials are set, but this Facebook Page has no Instagram Business account linked. Link an IG Business/Creator account to the Page in Meta Business Suite or Facebook Page Settings.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Meta API error";
    return NextResponse.json({
      configured: true,
      hasInstagram: false,
      message: `Meta API error: ${message}. Check the Page access token (pages_show_list, instagram_basic, instagram_manage_insights as needed) and that META_PAGE_ID is the Page id.`,
    });
  }
}
