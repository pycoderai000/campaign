import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
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

/** Use in API routes: throws if not authenticated or wrong role. */
export async function requireAuth(role?: "admin" | "brand"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (role && user.role !== role) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
