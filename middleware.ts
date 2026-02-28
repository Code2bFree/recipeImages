import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const VAULT_COOKIE = "vault_access";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow Next internals + common static files
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // Allow the vault page + login endpoint
  if (pathname === "/vault" || pathname.startsWith("/api/vault/login")) {
    return NextResponse.next();
  }

  // Protect everything else
  const hasAccess = req.cookies.get(VAULT_COOKIE)?.value === "1";
  if (!hasAccess) {
    const url = req.nextUrl.clone();
    url.pathname = "/vault";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
