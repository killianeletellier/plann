import { eq, inArray } from "drizzle-orm";
import { VolunteerPlanningView } from "@/components/planning/VolunteerPlanningView";
import { getSession } from "@/lib/auth/session";
import { getVolunteerEvents } from "@/lib/dashboard";
import { db } from "@/lib/db/client";
import { animations, locations, posts, slots, tasks } from "@/lib/db/schema";

export default async function VolunteerPlanningPage() {
  const session = await getSession();
  if (!session) return null;

  const [allAnimations, allTasks, allPosts, allLocations] = await Promise.all([
    db.query.animations.findMany({
      where: eq(animations.festivalId, session.festivalId),
      with: { volunteers: true, location: true },
    }),
    db.query.tasks.findMany({
      where: eq(tasks.festivalId, session.festivalId),
      with: { volunteers: true, location: true },
    }),
    db.query.posts.findMany({
      where: eq(posts.festivalId, session.festivalId),
    }),
    db.query.locations.findMany({
      where: eq(locations.festivalId, session.festivalId),
    }),
  ]);

  const postIds = allPosts.map((p) => p.id);

  const allSlots =
    postIds.length > 0
      ? await db.query.slots.findMany({
          where: inArray(slots.postId, postIds),
          with: { volunteers: true, post: { with: { location: true } } },
        })
      : [];

  const events = getVolunteerEvents(session.userId, allAnimations, allTasks, allSlots);

  const enriched = events.map((e) => {
    let location: string | undefined;
    let locationId: string | undefined;

    if (e.type === "animation") {
      const anim = allAnimations.find((a) => a.id === e.id);
      location = anim?.location?.name;
      locationId = anim?.locationId ?? anim?.location?.id;
    } else if (e.type === "task") {
      const task = allTasks.find((t) => t.id === e.id);
      location = task?.location?.name;
      locationId = task?.locationId ?? task?.location?.id;
    } else {
      const slot = allSlots.find((s) => s.id === e.id);
      location = slot?.post?.location?.name;
      locationId = slot?.post?.locationId ?? slot?.post?.location?.id;
    }

    return { ...e, location, locationId };
  });

  return (
    <VolunteerPlanningView
      events={enriched}
      locations={allLocations.map((l) => ({
        id: l.id,
        name: l.name,
        type: l.type,
      }))}
    />
  );
}
