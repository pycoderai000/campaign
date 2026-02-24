import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    role: "admin" | "brand";
    brandId?: string | null;
    name?: string | null;
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "brand";
    brandId?: string | null;
    name?: string | null;
  }
}
