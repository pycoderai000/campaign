import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { uploadToS3, isS3Configured, resolveMimeType } from "@/lib/s3";

export const runtime = "nodejs";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
];

function isAllowedMime(mime: string): boolean {
  if (!mime || mime === "application/octet-stream") return false;
  if (ALLOWED_TYPES.includes(mime)) return true;
  return mime.startsWith("image/") || mime.startsWith("video/");
}

export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  type FileLike = { size: number; name?: string; type?: string; arrayBuffer: () => Promise<ArrayBuffer> };
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (e) {
    console.error("upload formData parse error:", e);
    return NextResponse.json(
      { error: "Could not read upload body. If you use a reverse proxy, increase client_max_body_size (e.g. nginx) and ensure the request is not truncated." },
      { status: 400 }
    );
  }

  const files = formData.getAll("files");
  const fileList = files.filter((f) => {
    if (!f || typeof f !== "object" || !("size" in f)) return false;
    const fl = f as FileLike;
    return typeof fl.size === "number" && fl.size > 0 && typeof fl.arrayBuffer === "function";
  }) as FileLike[];

  if (fileList.length === 0) {
    return NextResponse.json(
      { error: "No files provided. Use form field 'files' (single or multiple)." },
      { status: 400 }
    );
  }

  if (!isS3Configured()) {
    return NextResponse.json(
      {
        error:
          "S3 is not configured. Set S3_BUCKET (and AWS_REGION). On EC2, use an IAM role with s3:PutObject on the bucket, or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.",
      },
      { status: 503 }
    );
  }

  const urls: string[] = [];

  for (const f of fileList) {
    if (f.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File ${f.name ?? "file"} exceeds 50MB limit` },
        { status: 400 }
      );
    }
    const reported = f.type ?? "";
    const resolved = resolveMimeType(f.name || "file", reported);
    if (!isAllowedMime(resolved)) {
      return NextResponse.json(
        { error: `File type not allowed: ${f.name ?? "file"} (${resolved || "unknown"})` },
        { status: 400 }
      );
    }
    const buffer = Buffer.from(await f.arrayBuffer());
    const originalName = f.name || "file";

    try {
      const url = await uploadToS3(buffer, originalName, reported);
      urls.push(url);
    } catch (e) {
      console.error("S3 upload error:", e);
      const name = e && typeof e === "object" && "name" in e ? String((e as { name?: string }).name) : "";
      const msg = e instanceof Error ? e.message : "Failed to upload file to S3";
      const hint =
        name === "AccessDenied" || /Access Denied/i.test(msg)
          ? " Check IAM permissions (s3:PutObject on the bucket) and bucket name/region."
          : "";
      return NextResponse.json({ error: `${msg}${hint}` }, { status: 500 });
    }
  }

  return NextResponse.json({ urls });
}
