import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth/jwt";
import { registerSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError, checkRateLimit } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const rl = checkRateLimit(`register_${ip}`, 10, 60);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", "Too many registration attempts. Please try again later.", 429);
    }

    const body = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid registration parameters", 400, parsed.error.flatten());
    }

    await connectToDatabase();

    const existing = await User.findOne({ email: parsed.data.email });
    if (existing) {
      return apiError("USER_EXISTS", "A user with this email address already exists", 409);
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role || "MEMBER",
    });

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const res = apiSuccess(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      201
    );

    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Registration failed", 500, err instanceof Error ? err.message : String(err));
  }
}
