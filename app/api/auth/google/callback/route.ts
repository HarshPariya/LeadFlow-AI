import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/models/User";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth/jwt";
import { env } from "@/lib/env";

/**
 * GET /api/auth/google/callback
 * Receives the authorization code from Google, exchanges it for tokens,
 * fetches the user profile, upserts the user in MongoDB, and sets the
 * LeadFlow session cookie — exactly the same cookie the email/password
 * login sets.
 */
export async function GET(req: NextRequest) {
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const { searchParams } = req.nextUrl;

  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const errorParam = searchParams.get("error");

  // --- Handle user-cancelled or error from Google --------------------------------
  if (errorParam) {
    return NextResponse.redirect(
      `${appUrl}/login?error=${encodeURIComponent("Google sign-in was cancelled or failed.")}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/login?error=${encodeURIComponent("No authorization code returned from Google.")}`
    );
  }

  // --- Decode state (redirect destination) --------------------------------------
  let redirectAfter = "/dashboard";
  try {
    if (stateRaw) {
      const decoded = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8"));
      if (decoded?.redirect && decoded.redirect.startsWith("/")) {
        redirectAfter = decoded.redirect;
      }
    }
  } catch {
    // Ignore bad state; just go to dashboard
  }

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = `${appUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret || clientId === "your_google_client_id_here") {
    return NextResponse.redirect(
      `${appUrl}/login?error=${encodeURIComponent("Google OAuth is not configured on this server.")}`
    );
  }

  try {
    // --- Step 1: Exchange authorization code for tokens -------------------------
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenRes.ok) {
      const msg = await tokenRes.text();
      console.error("[GoogleOAuth] Token exchange failed:", msg);
      return NextResponse.redirect(
        `${appUrl}/login?error=${encodeURIComponent("Failed to verify Google identity. Please try again.")}`
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;

    // --- Step 2: Fetch user profile from Google ---------------------------------
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      return NextResponse.redirect(
        `${appUrl}/login?error=${encodeURIComponent("Could not retrieve your Google profile.")}`
      );
    }

    const profile = await profileRes.json();
    // Google profile fields: sub, email, email_verified, name, picture
    const { sub: googleId, email, name, picture: avatarUrl, email_verified } = profile;

    if (!email || !email_verified) {
      return NextResponse.redirect(
        `${appUrl}/login?error=${encodeURIComponent("Your Google email is not verified. Please verify it first.")}`
      );
    }

    // --- Step 3: Upsert user in MongoDB -----------------------------------------
    await connectToDatabase();

    const { Workspace } = await import("@/models/Workspace");
    const { Membership } = await import("@/models/Membership");
    const { ActivityLog } = await import("@/models/ActivityLog");

    let isNewUser = false;
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      isNewUser = true;
      user = await User.create({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        googleId,
        avatarUrl,
        role: "OWNER",
        passwordHash: null,  // OAuth-only account
        lastLoginAt: new Date(),
      });
    } else {
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatarUrl && avatarUrl) user.avatarUrl = avatarUrl;
      user.lastLoginAt = new Date();
      await user.save();
    }

    // --- Step 4: Ensure Workspace & Membership ---------------------------------
    let workspace = user.defaultWorkspaceId ? await Workspace.findById(user.defaultWorkspaceId) : null;
    let membership = null;

    if (!workspace) {
      membership = await Membership.findOne({ userId: user._id });
      if (membership) {
        workspace = await Workspace.findById(membership.workspaceId);
      }
    }

    if (!workspace) {
      const slugBase = (user.name || "workspace")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .slice(0, 20);
      const uniqueSlug = `${slugBase}-${user._id.toString().slice(-6)}`;

      workspace = await Workspace.create({
        name: `${user.name || "My"}'s Workspace`,
        slug: uniqueSlug,
        ownerId: user._id,
      });

      membership = await Membership.create({
        workspaceId: workspace._id,
        userId: user._id,
        role: "OWNER",
      });

      user.defaultWorkspaceId = workspace._id;
      await user.save();

      // Log workspace created
      await ActivityLog.create({
        workspaceId: workspace._id,
        userId: user._id,
        actor: user.name,
        user: user.name,
        source: "auth",
        eventType: "WORKSPACE_CREATED",
        entityType: "workspace",
        entityId: workspace._id.toString(),
        status: "SUCCESS",
        message: `Personal workspace "${workspace.name}" provisioned for ${user.email}`,
      });
    }

    // Audit Log Login
    await ActivityLog.create({
      workspaceId: workspace._id,
      userId: user._id,
      actor: user.name,
      user: user.name,
      source: "auth",
      eventType: "LOGIN",
      entityType: "security",
      entityId: user._id.toString(),
      status: "SUCCESS",
      message: `User ${user.email} authenticated via Google OAuth${isNewUser ? " (New User)" : ""}`,
      metadata: { googleId, email: user.email, isNewUser },
    });

    // --- Step 5: Issue LeadFlow JWT session cookie ------------------------------
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      workspaceId: workspace._id.toString(),
    });

    const redirectUrl = new URL(redirectAfter, appUrl);
    const response = NextResponse.redirect(redirectUrl.toString());

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[GoogleOAuth] Callback error:", err);
    return NextResponse.redirect(
      `${appUrl}/login?error=${encodeURIComponent("An unexpected error occurred during Google sign-in.")}`
    );
  }
}
