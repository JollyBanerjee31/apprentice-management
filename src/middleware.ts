import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import type { Role } from "@/types/index";

const { auth } = NextAuth(authConfig);

// Only these roles have a dashboard to land on — "none" (revoked access)
// and any other unrecognized value fall through to /unauthorized instead
// of redirecting to a route that doesn't exist (e.g. "/none").
const DASHBOARD_ROLES = new Set<Role>(["apprentice", "manager", "hr"]);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const hasDashboard = !!role && DASHBOARD_ROLES.has(role);
  // Cached in the JWT at sign-in time, same as `role` — an apprentice
  // archived mid-session keeps dashboard access until their token next
  // refreshes. New sign-ins are blocked immediately via the signIn
  // callback in auth.ts, which is the primary defense.
  const isArchived = req.auth?.user?.active === false;

  const isLoginPage = pathname === "/login";
  const isUnauthorizedPage = pathname === "/unauthorized";

  if (isLoginPage) {
    if (isLoggedIn && role) {
      const dest = isArchived
        ? "/unauthorized?reason=archived"
        : hasDashboard
          ? `/${role}`
          : "/unauthorized";
      return Response.redirect(new URL(dest, req.nextUrl));
    }
    return;
  }

  if (isUnauthorizedPage) {
    return;
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  if (isArchived) {
    return Response.redirect(new URL("/unauthorized?reason=archived", req.nextUrl));
  }

  // Logged in via Google but not found in Firestore, role missing/unknown,
  // or revoked ("none").
  if (!hasDashboard) {
    return Response.redirect(new URL("/unauthorized", req.nextUrl));
  }

  if (pathname.startsWith("/apprentice") && role !== "apprentice") {
    return Response.redirect(new URL("/unauthorized", req.nextUrl));
  }
  if (pathname.startsWith("/manager") && role !== "manager") {
    return Response.redirect(new URL("/unauthorized", req.nextUrl));
  }
  if (pathname.startsWith("/hr") && role !== "hr") {
    return Response.redirect(new URL("/unauthorized", req.nextUrl));
  }

  if (pathname === "/") {
    return Response.redirect(new URL(`/${role}`, req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)"],
};
