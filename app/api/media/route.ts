import { NextResponse } from "next/server";
import { Readable } from "stream";
import { requireAuth } from "@/lib/auth";
import { getS3ObjectForKey, isS3Configured } from "@/lib/s3";

export const runtime = "nodejs";

/**
 * Authenticated proxy for private S3 objects under uploads/.
 * Use when the bucket does not allow anonymous GetObject (403 on direct HTTPS URLs).
 */
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!isS3Configured()) {
    return NextResponse.json({ error: "S3 is not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key")?.trim() ?? "";
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  try {
    const out = await getS3ObjectForKey(key);
    const body = out.Body;
    if (!body) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const stream = body as Readable;
    const web = Readable.toWeb(stream);

    return new Response(web as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": out.ContentType || "application/octet-stream",
        ...(out.ContentLength != null && { "Content-Length": String(out.ContentLength) }),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load object";
    if (msg === "Invalid key") {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }
    console.error("GET /api/media:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
