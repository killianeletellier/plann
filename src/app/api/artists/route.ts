import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireSession, requireAdmin } from "@/lib/api-helpers";
import { db } from "@/lib/db/client";
import { artists } from "@/lib/db/schema";
import { artistSchema } from "@/lib/validations";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const items = await db.query.artists.findMany({
    where: eq(artists.festivalId, session!.festivalId),
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = artistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const id = uuidv4();
  await db.insert(artists).values({
    id,
    festivalId: session!.festivalId,
    ...parsed.data,
  });

  const created = await db.query.artists.findFirst({ where: eq(artists.id, id) });
  return NextResponse.json(created, { status: 201 });
}
