import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME, AuthTokenPayload } from "./jwt";

export async function getServerSession(): Promise<AuthTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: NextRequest): AuthTokenPayload | null {
  // Check Authorization Bearer header first
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const verified = verifyToken(token);
    if (verified) return verified;
  }

  // Check cookie
  const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }

  return null;
}
