import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "leadflow_session_token";

// Public page paths that do not require authentication
const PUBLIC_PATHS = ["/", "/login", "/register", "/privacy", "/terms"];

// Public API endpoints that do not require user session cookies
const PUBLIC_API_PREFIXES = [
  "/api/auth/google",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/webhooks/",
  "/api/health/",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = crypto.randomUUID();

  // 0. Handle CORS preflight for cross-origin deployment
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin") || "*";
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Request-Id",
        "Access-Control-Allow-Credentials": "true",
        "X-Request-Id": requestId,
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

  // Define helper to add headers to the response
  const addDefaultHeaders = (response: NextResponse) => {
    response.headers.set("X-Request-Id", requestId);
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return response;
  };

  // 2. Allow public pages
  if (PUBLIC_PATHS.includes(pathname)) {
    return addDefaultHeaders(NextResponse.next());
  }

  // 3. Allow public APIs
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return addDefaultHeaders(NextResponse.next());
  }

  // 4. Check for session cookie or authorization header
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authHeader = request.headers.get("authorization");
  const hasAuth = Boolean(token || (authHeader && authHeader.startsWith("Bearer ")));

  if (!hasAuth) {
    // If requesting an API route, return 401 JSON
    if (pathname.startsWith("/api/")) {
      return addDefaultHeaders(
        NextResponse.json(
          {
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication session required",
            },
          },
          { status: 401 }
        )
      );
    }

    // If requesting a UI page, redirect to login with return path
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return addDefaultHeaders(NextResponse.redirect(loginUrl));
  }

  return addDefaultHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
