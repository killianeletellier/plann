import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireSession, requireAdmin } from "@/lib/api-helpers";
import { db } from "@/lib/db/client";
import { artists } from "@/lib/db/schema";
import { artistSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const item = await db.query.artists.findFirst({
    where: and(eq(artists.id, id), eq(artists.festivalId, session!.festivalId)),
  });
  if (!item) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await request.json();
  const parsed = artistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await db
    .update(artists)
    .set(parsed.data)
    .where(and(eq(artists.id, id), eq(artists.festivalId, session!.festivalId)));

  const updated = await db.query.artists.findFirst({ where: eq(artists.id, id) });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  await db
    .delete(artists)
    .where(and(eq(artists.id, id), eq(artists.festivalId, session!.festivalId)));

  return NextResponse.json({ success: true });
}
