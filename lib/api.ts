const BASE = "";

async function request<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const { json, ...init } = options;
  const headers: HeadersInit = {
    ...(init.headers as HeadersInit),
  };
  if (json !== undefined) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
    ...(json !== undefined && { body: JSON.stringify(json) }),
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.headers.get("content-type")?.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return undefined as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, json: unknown) => request<T>(path, { method: "POST", json }),
  patch: <T>(path: string, json: unknown) => request<T>(path, { method: "PATCH", json }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export async function uploadFiles(files: File[]): Promise<{ urls: string[] }> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const res = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

/** Build full URL for file display (img/video src). Handles relative /api/files/ paths. */
export function getFileDisplayUrl(url: string): string {
  if (typeof window === "undefined") return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${window.location.origin}${url}`;
  return `${window.location.origin}/${url}`;
}
