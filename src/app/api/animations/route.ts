import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireSession, requireAdmin } from "@/lib/api-helpers";
import { mapAnimationVolunteerInserts } from "@/lib/api-volunteers";
import { db } from "@/lib/db/client";
import { animationVolunteers, animations } from "@/lib/db/schema";
import { animationSchema } from "@/lib/validations";
import { defaultMissionColor } from "@/lib/mission-color";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const items = await db.query.animations.findMany({
    where: eq(animations.festivalId, session!.festivalId),
    with: {
      location: true,
      artist: true,
      volunteers: { with: { user: true } },
    },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = animationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const id = uuidv4();
  const { volunteers, ...data } = parsed.data;
  const color = data.color ?? defaultMissionColor(data.title);

  await db.insert(animations).values({
    id,
    festivalId: session!.festivalId,
    title: data.title,
    locationId: data.locationId,
    artistId: data.artistId || null,
    startAt: data.startAt,
    endAt: data.endAt,
    color,
  });

  if (volunteers?.length) {
    await db.insert(animationVolunteers).values(
      mapAnimationVolunteerInserts(id, volunteers),
    );
  }

  const created = await db.query.animations.findFirst({
    where: eq(animations.id, id),
    with: {
      location: true,
      artist: true,
      volunteers: { with: { user: true } },
    },
  });
  return NextResponse.json(created, { status: 201 });
}
