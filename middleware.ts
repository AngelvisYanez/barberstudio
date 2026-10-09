import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "barberstudio_session";
const TENANT_COOKIE = "barberstudio_tenant";

const publicPaths = ["/login"];

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = getSecret();

  let isAuthenticated = false;
  let role: string | null = null;
  let tenantId: string | null = null;

  if (token && secret) {
    try {
      const { payload } = await jwtVerify(token, secret);
      isAuthenticated = typeof payload.id === "string";
      role = typeof payload.role === "string" ? payload.role : null;
      tenantId = typeof payload.tenantId === "string" ? payload.tenantId : null;
    } catch {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && role !== "SUPERADMIN" && !tenantId) {
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (isAuthenticated && pathname === "/login") {
    const activeTenant = request.cookies.get(TENANT_COOKIE)?.value;
    const next =
      role === "SUPERADMIN" && !activeTenant ? "/tenants" : "/";
    return NextResponse.redirect(new URL(next, request.url));
  }

  if (
    pathname.startsWith("/admin") &&
    role !== "ADMIN" &&
    role !== "SUPERADMIN"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
