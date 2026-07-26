import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { db } from "@/lib/db/client";
import {
  animations,
  locations,
  posts,
  slots,
  tasks,
} from "@/lib/db/schema";
import { getLocationActivity } from "@/lib/dashboard";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const now = new Date();

  const allLocations = await db.query.locations.findMany({
    where: eq(locations.festivalId, session!.festivalId),
  });

  const allAnimations = await db.query.animations.findMany({
    where: eq(animations.festivalId, session!.festivalId),
    with: { artist: true, volunteers: { with: { user: true } } },
  });

  const allTasks = await db.query.tasks.findMany({
    where: eq(tasks.festivalId, session!.festivalId),
    with: { volunteers: { with: { user: true } } },
  });

  const allPosts = await db.query.posts.findMany({
    where: eq(posts.festivalId, session!.festivalId),
  });
  const postIds = allPosts.map((p) => p.id);

  const allSlots =
    postIds.length > 0
      ? await db.query.slots.findMany({
          where: inArray(slots.postId, postIds),
          with: { volunteers: { with: { user: true } }, post: true },
        })
      : [];

  const locationData = allLocations.map((loc) =>
    getLocationActivity(loc, allAnimations, allTasks, allSlots, now),
  );

  return NextResponse.json({ locations: locationData, now: now.toISOString() });
}
