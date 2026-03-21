/**
 * S3 upload helper. Uses env: S3_BUCKET, AWS_REGION.
 * Credentials: optional AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY; if omitted, the AWS SDK
 * uses the default credential chain (e.g. IAM instance profile on EC2 — recommended in production).
 * Optional: S3_PUBLIC_URL, S3_ENDPOINT.
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const bucket = process.env.S3_BUCKET;
const region = process.env.AWS_REGION || "us-east-1";
const publicBaseUrl = process.env.S3_PUBLIC_URL;
const customEndpoint = process.env.S3_ENDPOINT;

const EXT_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

function getClient(): S3Client | null {
  if (!bucket) return null;
  const config: ConstructorParameters<typeof S3Client>[0] = {
    region,
  };
  const key = process.env.AWS_ACCESS_KEY_ID;
  const secret = process.env.AWS_SECRET_ACCESS_KEY;
  if (key && secret) {
    config.credentials = { accessKeyId: key, secretAccessKey: secret };
  }
  // else: default provider chain (env vars, ~/.aws/credentials, IAM role, etc.)

  if (customEndpoint) {
    config.forcePathStyle = false;
    config.endpoint = customEndpoint;
  }
  return new S3Client(config);
}

/** Resolve Content-Type when browser sends empty or application/octet-stream. */
export function resolveMimeType(originalName: string, reportedType: string): string {
  const t = (reportedType || "").trim().toLowerCase();
  if (t && t !== "application/octet-stream") return t;
  const lower = originalName.toLowerCase();
  const dot = lower.lastIndexOf(".");
  const ext = dot >= 0 ? lower.slice(dot) : "";
  if (ext && EXT_MIME[ext]) return EXT_MIME[ext];
  return t || "application/octet-stream";
}

/**
 * Upload a file (Buffer from FormData/File) to S3 and return the public URL.
 * Key format: uploads/{uuid}{ext}
 */
export async function uploadToS3(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<string> {
  const client = getClient();
  if (!client || !bucket) {
    throw new Error(
      "S3 is not configured. Set S3_BUCKET (and AWS_REGION if not us-east-1). On AWS, attach an IAM role with s3:PutObject or set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY."
    );
  }
  const resolved = resolveMimeType(originalName, mimeType);
  const ext =
    originalName.includes(".") ? originalName.slice(originalName.lastIndexOf(".")) : resolved.startsWith("image/")
      ? ".jpg"
      : ".mp4";
  const key = `uploads/${randomUUID()}${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: resolved,
    })
  );

  if (publicBaseUrl) {
    const base = publicBaseUrl.replace(/\/$/, "");
    return `${base}/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/** True when bucket is set (credentials may come from IAM role). */
export function isS3Configured(): boolean {
  return !!bucket;
}
