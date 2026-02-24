import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const pathSegments = (await params).path;
  if (!pathSegments?.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const filename = pathSegments[pathSegments.length - 1];
  if (filename.includes("..") || pathSegments.some((p) => p.includes(".."))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const filepath = path.join(UPLOAD_DIR, path.join(...pathSegments));
  try {
    const buffer = await readFile(filepath);
    const ext = path.extname(filename).toLowerCase();
    const types: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
    };
    const contentType = types[ext] ?? "application/octet-stream";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
