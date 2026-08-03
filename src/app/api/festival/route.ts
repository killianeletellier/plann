import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin, requireSession } from "@/lib/api-helpers";
import { db } from "@/lib/db/client";
import { festivals } from "@/lib/db/schema";
import { festivalSchema } from "@/lib/validations";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const festival = await db.query.festivals.findFirst({
    where: eq(festivals.id, session!.festivalId),
    columns: { id: true, name: true, code: true, startDate: true, endDate: true },
  });

  if (!festival) {
    return NextResponse.json({ error: "Festival introuvable" }, { status: 404 });
  }

  return NextResponse.json(festival);
}

export async function PATCH(request: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = festivalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.query.festivals.findFirst({
    where: eq(festivals.id, session!.festivalId),
  });
  if (!existing) {
    return NextResponse.json({ error: "Festival introuvable" }, { status: 404 });
  }

  const codeTaken = await db.query.festivals.findFirst({
    where: and(
      eq(festivals.code, parsed.data.code),
      ne(festivals.id, session!.festivalId),
    ),
  });
  if (codeTaken) {
    return NextResponse.json(
      { error: "Ce code festival est déjà utilisé" },
      { status: 409 },
    );
  }

  await db
    .update(festivals)
    .set({
      name: parsed.data.name,
      code: parsed.data.code,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
    })
    .where(eq(festivals.id, session!.festivalId));

  const updated = await db.query.festivals.findFirst({
    where: eq(festivals.id, session!.festivalId),
    columns: { id: true, name: true, code: true, startDate: true, endDate: true },
  });

  return NextResponse.json(updated);
}
