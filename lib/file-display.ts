/** Client-side helpers for deliverable file URLs (S3, /api/files/, etc.) */

import type { FileOrUrl } from "@/types";
import { isSafeUploadsObjectKey } from "@/lib/s3-upload-key";

/**
 * When the S3 bucket is private, direct https://bucket.s3.../uploads/... URLs return 403 in the browser.
 * Rewrite those to the authenticated app proxy (same-origin, session cookie).
 */
function shouldProxyToApiMedia(url: string): boolean {
  if (process.env.NEXT_PUBLIC_DISABLE_S3_MEDIA_PROXY === "1") return false;
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\//, "");
    if (!isSafeUploadsObjectKey(path)) return false;
    const h = u.hostname.toLowerCase();
    if (h.includes(".amazonaws.com")) return true;
    if (h.includes(".cloudfront.net")) return true;
    const extras = (process.env.NEXT_PUBLIC_S3_MEDIA_EXTRA_HOSTS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    return extras.includes(h);
  } catch {
    return false;
  }
}

export function getFileDisplayUrl(url: string): string {
  const t = (url || "").trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) {
    if (shouldProxyToApiMedia(t)) {
      try {
        const path = new URL(t).pathname.replace(/^\//, "");
        return `/api/media?key=${encodeURIComponent(path)}`;
      } catch {
        return t;
      }
    }
    return t;
  }
  if (typeof window === "undefined") return t;
  if (t.startsWith("/")) return `${window.location.origin}${t}`;
  return `${window.location.origin}/${t}`;
}

/** Whether URL path looks like an image (S3 keys often end in .png/.jpg). */
export function isImageUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  try {
    const path = new URL(t).pathname;
    return /\.(jpe?g|png|gif|webp|svg|bmp|avif)$/i.test(path) || /\/uploads\//i.test(path);
  } catch {
    return /\.(jpe?g|png|gif|webp|svg)/i.test(t) || t.includes("/uploads/");
  }
}

export function isVideoUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  try {
    const path = new URL(t).pathname;
    return /\.(mp4|webm|ogg|mov|m4v)$/i.test(path);
  } catch {
    return /\.(mp4|webm|ogg|mov|m4v)/i.test(t);
  }
}

export function isImageFileOrUrl(f: FileOrUrl): boolean {
  if (typeof f === "string") return isImageUrl(f);
  if (f instanceof File) return f.type.startsWith("image/");
  return false;
}

export function isVideoFileOrUrl(f: FileOrUrl): boolean {
  if (typeof f === "string") return isVideoUrl(f);
  if (f instanceof File) return f.type.startsWith("video/");
  return false;
}
