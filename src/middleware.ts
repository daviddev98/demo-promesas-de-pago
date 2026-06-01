import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, getSessionFromCookieValue } from "@/lib/auth";

const PUBLIC = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const session = getSessionFromCookieValue(
    request.cookies.get(COOKIE_NAME)?.value
  );

  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    if (session && pathname === "/login") {
      return NextResponse.redirect(new URL("/promesas", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
