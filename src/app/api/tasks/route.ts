import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireSession, requireAdmin } from "@/lib/api-helpers";
import { mapTaskVolunteerInserts } from "@/lib/api-volunteers";
import { db } from "@/lib/db/client";
import { taskVolunteers, tasks } from "@/lib/db/schema";
import { taskSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  const allTasks = await db.query.tasks.findMany({
    where: eq(tasks.festivalId, session!.festivalId),
    with: { volunteers: { with: { user: true } }, location: true },
  });

  const filtered = userId
    ? allTasks.filter((t) => t.volunteers.some((v) => v.userId === userId))
    : allTasks;

  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const id = uuidv4();
  const { volunteers, ...data } = parsed.data;

  await db.insert(tasks).values({
    id,
    festivalId: session!.festivalId,
    title: data.title,
    description: data.description,
    locationId: data.locationId || null,
    startAt: data.startAt,
    endAt: data.endAt,
  });

  await db.insert(taskVolunteers).values(
    mapTaskVolunteerInserts(id, volunteers),
  );

  const created = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: { volunteers: { with: { user: true } }, location: true },
  });
  return NextResponse.json(created, { status: 201 });
}
