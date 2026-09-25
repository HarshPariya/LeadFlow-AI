import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/auth/password";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth/jwt";
import { loginSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError, checkRateLimit } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const rl = checkRateLimit(`login_${ip}`, 15, 60);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", "Too many login attempts. Please wait.", 429);
    }

    const body = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid email or password format", 400);
    }

    await connectToDatabase();

    const user = await User.findOne({ email: parsed.data.email });
    if (!user) {
      return apiError("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    // OAuth-only accounts have no password — prompt them to use Google Sign-In
    if (!user.passwordHash) {
      return apiError(
        "OAUTH_ACCOUNT",
        "This account was created with Google. Please use the 'Continue with Google' button to sign in.",
        401
      );
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return apiError("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const res = apiSuccess({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Authentication error", 500, err instanceof Error ? err.message : String(err));
  }
}
