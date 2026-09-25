import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
const AUTH_COOKIE_NAME = "leadflow_session_token";

// Public page paths that do not require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/privacy",
  "/terms",
];

// Public API endpoints that do not require user session cookies
const PUBLIC_API_PREFIXES = [
  "/api/auth/google",
  "/api/auth/logout",
  "/api/webhooks/",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. Handle CORS preflight for cross-origin deployment (e.g. Vercel frontend -> Render backend)
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin") || "*";
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  // 1. Bypass static assets and Next internal files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/icon.svg") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Allow public pages
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // 3. Allow public APIs
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 4. Check for session cookie or authorization header
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authHeader = request.headers.get("authorization");
  const hasAuth = Boolean(token || (authHeader && authHeader.startsWith("Bearer ")));

  if (!hasAuth) {
    // If requesting an API route, return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication session required",
          },
        },
        { status: 401 }
      );
    }

    // If requesting a UI page, redirect to login with return path
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
