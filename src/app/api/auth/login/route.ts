import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyPin } from "@/lib/auth/hash";
import { signToken } from "@/lib/auth/jwt";
import { getSessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { festivals, users } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { festivalCode, pin } = parsed.data;

    const festival = await db.query.festivals.findFirst({
      where: eq(festivals.code, festivalCode),
    });
    if (!festival) {
      return NextResponse.json(
        { error: "Code festival invalide" },
        { status: 401 },
      );
    }

    const allUsers = await db.query.users.findMany({
      where: eq(users.festivalId, festival.id),
    });

    let matchedUser = null;
    for (const user of allUsers) {
      if (await verifyPin(pin, user.pinHash)) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return NextResponse.json({ error: "PIN invalide" }, { status: 401 });
    }

    const token = signToken({
      userId: matchedUser.id,
      festivalId: festival.id,
      isAdmin: matchedUser.isAdmin,
      firstName: matchedUser.firstName,
      lastName: matchedUser.lastName,
    });

    const response = NextResponse.json({
      user: {
        id: matchedUser.id,
        firstName: matchedUser.firstName,
        lastName: matchedUser.lastName,
        isAdmin: matchedUser.isAdmin,
      },
      redirectTo: matchedUser.isAdmin ? "/admin" : "/",
    });

    response.cookies.set(
      SESSION_COOKIE,
      token,
      getSessionCookieOptions(request, 60 * 60 * 24 * 7),
    );

    return response;
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
