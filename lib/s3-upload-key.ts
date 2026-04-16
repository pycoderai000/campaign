/** Keys produced by uploadToS3: uploads/{uuid}{ext} */
export const SAFE_UPLOADS_OBJECT_KEY =
  /^uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[^/]+$/i;

export function isSafeUploadsObjectKey(key: string): boolean {
  return SAFE_UPLOADS_OBJECT_KEY.test(key);
}
