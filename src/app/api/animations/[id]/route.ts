import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireSession, requireAdmin } from "@/lib/api-helpers";
import { mapAnimationVolunteerInserts } from "@/lib/api-volunteers";
import { db } from "@/lib/db/client";
import { animationVolunteers, animations } from "@/lib/db/schema";
import { animationSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const item = await db.query.animations.findFirst({
    where: and(eq(animations.id, id), eq(animations.festivalId, session!.festivalId)),
    with: {
      location: true,
      artist: true,
      volunteers: { with: { user: true } },
    },
  });
  if (!item) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await request.json();
  const parsed = animationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { volunteers, ...data } = parsed.data;

  await db
    .update(animations)
    .set({
      title: data.title,
      locationId: data.locationId,
      artistId: data.artistId || null,
      startAt: data.startAt,
      endAt: data.endAt,
    })
    .where(and(eq(animations.id, id), eq(animations.festivalId, session!.festivalId)));

  await db.delete(animationVolunteers).where(eq(animationVolunteers.animationId, id));
  if (volunteers?.length) {
    await db.insert(animationVolunteers).values(
      mapAnimationVolunteerInserts(id, volunteers),
    );
  }

  const updated = await db.query.animations.findFirst({
    where: eq(animations.id, id),
    with: {
      location: true,
      artist: true,
      volunteers: { with: { user: true } },
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  await db
    .delete(animations)
    .where(and(eq(animations.id, id), eq(animations.festivalId, session!.festivalId)));

  return NextResponse.json({ success: true });
}
