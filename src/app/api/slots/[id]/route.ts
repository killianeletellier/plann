import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireSession, requireAdmin } from "@/lib/api-helpers";
import { mapSlotVolunteerInserts } from "@/lib/api-volunteers";
import { db } from "@/lib/db/client";
import { slotVolunteers, slots } from "@/lib/db/schema";
import { slotSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await request.json();
  const parsed = slotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { volunteers, ...data } = parsed.data;

  await db
    .update(slots)
    .set({
      postId: data.postId,
      startAt: data.startAt,
      endAt: data.endAt,
    })
    .where(eq(slots.id, id));

  await db.delete(slotVolunteers).where(eq(slotVolunteers.slotId, id));
  if (volunteers?.length) {
    await db.insert(slotVolunteers).values(
      mapSlotVolunteerInserts(id, volunteers),
    );
  }

  const updated = await db.query.slots.findFirst({
    where: eq(slots.id, id),
    with: {
      post: { with: { location: true } },
      volunteers: { with: { user: true } },
    },
  });
  if (!updated || updated.post.festivalId !== session!.festivalId) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  await db.delete(slots).where(eq(slots.id, id));
  return NextResponse.json({ success: true });
}

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const item = await db.query.slots.findFirst({
    where: eq(slots.id, id),
    with: {
      post: { with: { location: true } },
      volunteers: { with: { user: true } },
    },
  });
  if (!item || item.post.festivalId !== session!.festivalId) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }
  return NextResponse.json(item);
}
