import { cookies } from "next/headers";
import { verifyToken, type SessionPayload } from "./jwt";

export const SESSION_COOKIE = "plann_session";

function isSecureRequest(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedProto) return forwardedProto === "https";
  return new URL(request.url).protocol === "https:";
}

export function getSessionCookieOptions(request: Request, maxAge: number) {
  return {
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getSessionFromToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  return verifyToken(token);
}
