import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * GET /api/auth/google
 * Builds the Google OAuth 2.0 authorization URL and redirects the user there.
 * Accepts optional ?redirect= query param to return to after login.
 */
export async function GET(req: NextRequest) {
  const clientId = env.GOOGLE_CLIENT_ID;

  if (!clientId || clientId === "your_google_client_id_here") {
    return NextResponse.json(
      {
        error: "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.",
      },
      { status: 503 }
    );
  }

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const appUrl = host ? `${proto}://${host}` : env.NEXT_PUBLIC_APP_URL;
  const redirectAfter = req.nextUrl.searchParams.get("redirect") || "/dashboard";

  // Build the callback URL — must match exactly what is registered in Google Cloud Console
  const callbackUrl = `${appUrl}/api/auth/google/callback`;

  // State encodes the redirect destination (base64 to keep URL clean)
  const state = Buffer.from(JSON.stringify({ redirect: redirectAfter })).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(googleAuthUrl);
}
