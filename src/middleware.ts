import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

const PUBLIC_PATHS = ["/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  if (!session) {
    const url = new URL("/login", req.url);
    // Preserve the destination so we can bounce back after login (future use)
    if (pathname !== "/" && !pathname.startsWith("/_next")) {
      url.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Match everything except Next internals, static files, and our /api/health.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico|css|js)).*)",
  ],
};
