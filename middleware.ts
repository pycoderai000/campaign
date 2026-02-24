import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;
      if (path.startsWith("/admin")) return token?.role === "admin";
      if (path.startsWith("/brand")) return token?.role === "brand";
      return true;
    },
  },
});

export const config = {
  matcher: ["/admin/:path*", "/brand/:path*"],
};
