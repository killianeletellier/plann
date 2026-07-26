import { NextResponse } from "next/server";
import { getSessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", getSessionCookieOptions(request, 0));
  return response;
}
