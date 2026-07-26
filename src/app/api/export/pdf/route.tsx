import { format, isSameDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { eq, inArray } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireAdmin } from "@/lib/api-helpers";
import { db } from "@/lib/db/client";
import {
  animations,
  locations,
  posts,
  slots,
  tasks,
  users,
} from "@/lib/db/schema";
import type { PdfEventRow } from "@/lib/pdf/templates";
import { formatVolunteerName } from "@/lib/volunteer-display";
import {
  LocationDayPdf,
  LocationGlobalPdf,
  VolunteerDayPdf,
  VolunteerGlobalPdf,
} from "@/lib/pdf/templates";
import { pdfExportSchema } from "@/lib/validations";

function formatTimeRange(startAt: string, endAt: string) {
  const start = format(parseISO(startAt), "HH:mm", { locale: fr });
  const end = format(parseISO(endAt), "HH:mm", { locale: fr });
  return `${start} - ${end}`;
}

export async function POST(request: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = pdfExportSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { type, scope, targetId, date } = parsed.data;

  if (!targetId) {
    return new Response(JSON.stringify({ error: "Cible requise" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const festivalId = session!.festivalId;
  let pdfBuffer: Buffer;
  let filename = "planning.pdf";

  if (type === "location") {
    const location = await db.query.locations.findFirst({
      where: eq(locations.id, targetId),
    });
    if (!location || location.festivalId !== festivalId) {
      return new Response(JSON.stringify({ error: "Lieu non trouvé" }), { status: 404 });
    }

    const events = await buildLocationEvents(targetId, festivalId, scope, date);
    filename = `${location.name.replace(/\s+/g, "_")}_${scope}.pdf`;

    if (scope === "day" && date) {
      pdfBuffer = await renderToBuffer(
        <LocationDayPdf
          locationName={location.name}
          date={format(parseISO(date), "dd MMMM yyyy", { locale: fr })}
          events={events}
        />,
      );
    } else {
      pdfBuffer = await renderToBuffer(
        <LocationGlobalPdf locationName={location.name} events={events} />,
      );
    }
  } else {
    const user = await db.query.users.findFirst({
      where: eq(users.id, targetId),
    });
    if (!user || user.festivalId !== festivalId) {
      return new Response(JSON.stringify({ error: "Bénévole non trouvé" }), { status: 404 });
    }

    const events = await buildVolunteerEvents(targetId, festivalId, scope, date);
    const name = `${user.firstName} ${user.lastName}`;
    filename = `${name.replace(/\s+/g, "_")}_${scope}.pdf`;

    if (scope === "day" && date) {
      pdfBuffer = await renderToBuffer(
        <VolunteerDayPdf
          volunteerName={name}
          date={format(parseISO(date), "dd MMMM yyyy", { locale: fr })}
          events={events}
        />,
      );
    } else {
      pdfBuffer = await renderToBuffer(
        <VolunteerGlobalPdf volunteerName={name} events={events} />,
      );
    }
  }

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function buildLocationEvents(
  locationId: string,
  festivalId: string,
  scope: "day" | "global",
  date?: string,
): Promise<PdfEventRow[]> {
  const location = await db.query.locations.findFirst({
    where: eq(locations.id, locationId),
  });

  const allAnimations = await db.query.animations.findMany({
    where: eq(animations.festivalId, festivalId),
    with: { artist: true, volunteers: { with: { user: true } } },
  });

  const allTasks = await db.query.tasks.findMany({
    where: eq(tasks.festivalId, festivalId),
    with: { volunteers: { with: { user: true } } },
  });

  const allPosts = await db.query.posts.findMany({
    where: eq(posts.festivalId, festivalId),
  });
  const postIds = allPosts.filter((p) => p.locationId === locationId).map((p) => p.id);

  const allSlots =
    postIds.length > 0
      ? await db.query.slots.findMany({
          where: inArray(slots.postId, postIds),
          with: { volunteers: { with: { user: true } }, post: true },
        })
      : [];

  const rows: PdfEventRow[] = [];

  for (const a of allAnimations.filter((x) => x.locationId === locationId)) {
    if (scope === "day" && date && !isSameDay(parseISO(a.startAt), parseISO(date))) continue;
    const people: string[] = [];
    if (a.artist?.name) people.push(a.artist.name);
    for (const v of a.volunteers) {
      if (v.user) people.push(formatVolunteerName(v.user, v.role));
    }
    rows.push({
      time: formatTimeRange(a.startAt, a.endAt),
      type: "Animation",
      title: a.title,
      people: people.join(", "),
      location: location?.name || "",
    });
  }

  for (const t of allTasks.filter((x) => x.locationId === locationId)) {
    if (scope === "day" && date && !isSameDay(parseISO(t.startAt), parseISO(date))) continue;
    const people = t.volunteers
      .filter((v) => v.user)
      .map((v) => formatVolunteerName(v.user!, v.role));
    rows.push({
      time: formatTimeRange(t.startAt, t.endAt),
      type: "Tâche",
      title: t.title,
      people: people.join(", "),
      location: location?.name || "",
    });
  }

  for (const s of allSlots) {
    if (scope === "day" && date && !isSameDay(parseISO(s.startAt), parseISO(date))) continue;
    const people = s.volunteers
      .filter((v) => v.user)
      .map((v) => formatVolunteerName(v.user!, v.role));
    rows.push({
      time: formatTimeRange(s.startAt, s.endAt),
      type: "Poste",
      title: s.post?.title || "Poste",
      people: people.length > 0 ? people.join(", ") : "Non assigné",
      location: location?.name || "",
    });
  }

  rows.sort((a, b) => a.time.localeCompare(b.time));
  return rows;
}

async function buildVolunteerEvents(
  userId: string,
  festivalId: string,
  scope: "day" | "global",
  date?: string,
): Promise<PdfEventRow[]> {
  const allLocations = await db.query.locations.findMany({
    where: eq(locations.festivalId, festivalId),
  });
  const locMap = new Map(allLocations.map((l) => [l.id, l.name]));

  const allAnimations = await db.query.animations.findMany({
    where: eq(animations.festivalId, festivalId),
    with: { artist: true, volunteers: { with: { user: true } } },
  });

  const allTasks = await db.query.tasks.findMany({
    where: eq(tasks.festivalId, festivalId),
    with: { volunteers: { with: { user: true } }, location: true },
  });

  const allPosts = await db.query.posts.findMany({
    where: eq(posts.festivalId, festivalId),
  });
  const postIds = allPosts.map((p) => p.id);

  const allSlots =
    postIds.length > 0
      ? await db.query.slots.findMany({
          where: inArray(slots.postId, postIds),
          with: { volunteers: { with: { user: true } }, post: { with: { location: true } } },
        })
      : [];

  const rows: PdfEventRow[] = [];

  for (const a of allAnimations) {
    const assignment = a.volunteers.find((v) => v.userId === userId);
    if (!assignment) continue;
    if (scope === "day" && date && !isSameDay(parseISO(a.startAt), parseISO(date))) continue;
    const people = [a.artist?.name, assignment.role].filter(Boolean).join(" · ");
    rows.push({
      time: formatTimeRange(a.startAt, a.endAt),
      type: "Animation",
      title: a.title,
      people,
      location: locMap.get(a.locationId) || "",
    });
  }

  for (const t of allTasks) {
    const assignment = t.volunteers.find((v) => v.userId === userId);
    if (!assignment) continue;
    if (scope === "day" && date && !isSameDay(parseISO(t.startAt), parseISO(date))) continue;
    rows.push({
      time: formatTimeRange(t.startAt, t.endAt),
      type: "Tâche",
      title: t.title,
      people: assignment.role || "",
      location: t.location?.name || "",
    });
  }

  for (const s of allSlots) {
    const assignment = s.volunteers.find((v) => v.userId === userId);
    if (!assignment) continue;
    if (scope === "day" && date && !isSameDay(parseISO(s.startAt), parseISO(date))) continue;
    rows.push({
      time: formatTimeRange(s.startAt, s.endAt),
      type: "Poste",
      title: s.post?.title || "Poste",
      people: assignment.role || "",
      location: s.post?.location?.name || "",
    });
  }

  rows.sort((a, b) => a.time.localeCompare(b.time));
  return rows;
}
