import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminFromRequest } from "./lib/auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin and its subpaths.
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  if (!isAdminFromRequest(req)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
