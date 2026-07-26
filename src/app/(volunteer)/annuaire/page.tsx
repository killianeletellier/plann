import { eq } from "drizzle-orm";
import { Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { STABLE_EMPTY_LIST } from "@/lib/ui-stable";
import { cn } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { artists, users } from "@/lib/db/schema";

export default async function AnnuairePage() {
  const session = await getSession();
  if (!session) return null;

  const allUsers = await db.query.users.findMany({
    where: eq(users.festivalId, session.festivalId),
  });

  const allArtists = await db.query.artists.findMany({
    where: eq(artists.festivalId, session.festivalId),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Annuaire</h2>

      <section>
        <h3 className="font-medium text-zinc-700 mb-3">Bénévoles</h3>
        <div className="space-y-2">
          {allUsers.map((u) => (
            <Card key={u.id} className="min-h-[4.5rem]">
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-sm text-zinc-500 min-h-[1.25rem] mt-1">
                    {u.phone ? (
                      <a href={`tel:${u.phone}`} className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {u.phone}
                      </a>
                    ) : (
                      "\u00A0"
                    )}
                  </p>
                </div>
                <span className="min-w-[3.5rem] shrink-0">
                  {u.isAdmin ? <Badge variant="info">Admin</Badge> : null}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-medium text-zinc-700 mb-3">Artistes</h3>
        <div className="space-y-2">
          {allArtists.length === 0 ? (
            <p className={cn(STABLE_EMPTY_LIST, "text-sm text-zinc-500")}>Aucun artiste</p>
          ) : (
            allArtists.map((a) => (
              <Card key={a.id} className="min-h-[4.5rem]">
                <CardContent className="py-4">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-zinc-500 min-h-[1.25rem] mt-1">
                    {a.phone ? (
                      <a href={`tel:${a.phone}`} className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {a.phone}
                      </a>
                    ) : (
                      "\u00A0"
                    )}
                  </p>
                  <p className="text-sm text-zinc-500 mt-1 min-h-[1.25rem]">
                    {a.description ?? "\u00A0"}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
