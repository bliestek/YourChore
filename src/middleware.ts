import { NextRequest, NextResponse } from "next/server";
import { verifyToken, TokenPayload } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicPaths = ["/", "/login", "/register", "/child-select", "/join", "/offline.html"];
  const isPublic =
    publicPaths.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/family") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/favicon.svg";

  if (isPublic) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("token", "", { maxAge: 0 });
    return response;
  }

  // Route protection: children can't access parent routes and vice versa
  if (pathname.startsWith("/parent") && payload.role !== "parent") {
    return NextResponse.redirect(new URL("/child", request.url));
  }
  if (pathname.startsWith("/child") && payload.role !== "child") {
    return NextResponse.redirect(new URL("/parent", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
