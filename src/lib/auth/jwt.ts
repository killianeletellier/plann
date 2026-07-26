import jwt from "jsonwebtoken";

const SESSION_DURATION = "7d";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }
  return "plann-dev-secret-change-in-production";
}

export interface SessionPayload {
  userId: string;
  festivalId: string;
  isAdmin: boolean;
  firstName: string;
  lastName: string;
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: SESSION_DURATION });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}
