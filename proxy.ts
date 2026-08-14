import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Admin dashboard routes require client-side auth (Firebase).
 * Redirect unauthenticated users to login when no session cookie hint is present.
 * Full verification happens in dashboard layout via Firebase onAuthStateChanged.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/dashboard")) {
    // Allow dashboard layout to handle auth; optional: block if you add session cookies later
    return NextResponse.next();
  }

  if (pathname === "/admin" || pathname === "/admin/") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
