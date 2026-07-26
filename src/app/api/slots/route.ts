import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireSession, requireAdmin } from "@/lib/api-helpers";
import { mapSlotVolunteerInserts } from "@/lib/api-volunteers";
import { db } from "@/lib/db/client";
import { posts, slotVolunteers, slots } from "@/lib/db/schema";
import { sortSlotsChronologically } from "@/lib/dates";
import { slotSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  const userId = searchParams.get("userId");

  const festivalPosts = await db.query.posts.findMany({
    where: eq(posts.festivalId, session!.festivalId),
  });
  const postIds = festivalPosts.map((p) => p.id);

  if (postIds.length === 0) return NextResponse.json([]);

  let allSlots = await db.query.slots.findMany({
    where: inArray(slots.postId, postIds),
    with: {
      post: { with: { location: true } },
      volunteers: { with: { user: true } },
    },
  });

  if (postId) allSlots = allSlots.filter((s) => s.postId === postId);
  if (userId) {
    allSlots = allSlots.filter((s) => s.volunteers.some((v) => v.userId === userId));
  }

  return NextResponse.json(sortSlotsChronologically(allSlots));
}

export async function POST(request: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = slotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, parsed.data.postId),
  });
  if (!post || post.festivalId !== session!.festivalId) {
    return NextResponse.json({ error: "Poste invalide" }, { status: 400 });
  }

  const id = uuidv4();
  const { volunteers, ...data } = parsed.data;

  await db.insert(slots).values({
    id,
    postId: data.postId,
    startAt: data.startAt,
    endAt: data.endAt,
  });

  if (volunteers?.length) {
    await db.insert(slotVolunteers).values(
      mapSlotVolunteerInserts(id, volunteers),
    );
  }

  const created = await db.query.slots.findFirst({
    where: eq(slots.id, id),
    with: {
      post: { with: { location: true } },
      volunteers: { with: { user: true } },
    },
  });
  return NextResponse.json(created, { status: 201 });
}
