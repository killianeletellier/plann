import { eq, inArray } from "drizzle-orm";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STABLE_EMPTY_LIST } from "@/lib/ui-stable";
import { cn } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";
import { getVolunteerEvents } from "@/lib/dashboard";
import { db } from "@/lib/db/client";
import { animations, posts, slots, tasks } from "@/lib/db/schema";

export default async function VolunteerHomePage() {
  const session = await getSession();
  if (!session) return null;

  const allAnimations = await db.query.animations.findMany({
    where: eq(animations.festivalId, session.festivalId),
    with: { volunteers: { with: { user: true } }, location: true },
  });

  const allTasks = await db.query.tasks.findMany({
    where: eq(tasks.festivalId, session.festivalId),
    with: { volunteers: { with: { user: true } }, location: true },
  });

  const allPosts = await db.query.posts.findMany({
    where: eq(posts.festivalId, session.festivalId),
  });
  const postIds = allPosts.map((p) => p.id);

  const allSlots =
    postIds.length > 0
      ? await db.query.slots.findMany({
          where: inArray(slots.postId, postIds),
          with: { volunteers: { with: { user: true } }, post: { with: { location: true } } },
        })
      : [];

  const events = getVolunteerEvents(session.userId, allAnimations, allTasks, allSlots);
  const upcoming = events.filter((e) => !e.isPast).slice(0, 10);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Mes prochains créneaux</h2>
      {upcoming.length === 0 ? (
        <p className={cn(STABLE_EMPTY_LIST, "text-center text-zinc-500")}>Aucun créneau à venir</p>
      ) : (
        upcoming.map((e) => (
          <Card key={e.id} className={cn("min-h-[5.5rem]", e.isActive ? "border-green-400 bg-green-50" : "")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{e.title}</span>
                <div className="flex shrink-0 gap-2">
                  <span className="min-w-[4.5rem]">
                    {e.isActive ? <Badge variant="success">En cours</Badge> : null}
                  </span>
                  {e.role ? <Badge variant="info">{e.role}</Badge> : null}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600">
              <p>
                {format(parseISO(e.startAt), "EEEE d MMM, HH:mm", { locale: fr })} —{" "}
                {format(parseISO(e.endAt), "HH:mm", { locale: fr })}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
