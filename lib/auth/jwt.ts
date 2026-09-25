import jwt from "jsonwebtoken";
import { env } from "@/lib/env";
import { UserRole } from "@/models/User";

export interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  workspaceId?: string;
}

export const AUTH_COOKIE_NAME = "leadflow_session_token";

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.AUTH_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, env.AUTH_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}
