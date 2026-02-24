import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
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

export async function POST(request: Request) {
  await requireAuth();

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const fileList = files.filter((f) => f instanceof File && f.size > 0);

  if (fileList.length === 0) {
    return NextResponse.json(
      { error: "No files provided. Use form field 'files' (single or multiple)." },
      { status: 400 }
    );
  }

  const urls: string[] = [];

  await mkdir(UPLOAD_DIR, { recursive: true });

  for (const file of fileList) {
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File ${file.name} exceeds 50MB limit` },
        { status: 400 }
      );
    }
    const type = file.type;
    if (!ALLOWED_TYPES.includes(type) && !type.startsWith("image/")) {
      return NextResponse.json(
        { error: `File type not allowed: ${file.name}` },
        { status: 400 }
      );
    }
    const ext = path.extname(file.name) || (type.startsWith("image/") ? ".jpg" : ".mp4");
    const id = randomUUID();
    const filename = `${id}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);
    urls.push(`/api/files/${filename}`);
  }

  return NextResponse.json({ urls });
}
