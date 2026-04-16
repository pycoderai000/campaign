import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";

export type SessionUser = {
  id: string;
  email: string;
  role: "admin" | "brand";
  brandId: string | null;
  name: string | null;
};

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session?.user) return null;
  const u = session.user as SessionUser;
  return { id: u.id, email: u.email, role: u.role, brandId: u.brandId ?? null, name: u.name ?? null };
}

/**
 * Use in API routes: returns the session user, or a JSON 401/403 response.
 * Do not throw — Next.js 14 route handlers turn thrown Response into 500.
 */
export async function requireAuth(
  role?: "admin" | "brand"
): Promise<SessionUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (role && user.role !== role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return user;
}
