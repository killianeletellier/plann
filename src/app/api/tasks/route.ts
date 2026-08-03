import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireSession, requireAdmin } from "@/lib/api-helpers";
import { mapTaskVolunteerInserts } from "@/lib/api-volunteers";
import { db } from "@/lib/db/client";
import { taskVolunteers, tasks } from "@/lib/db/schema";
import { isTaskOverdue, withTaskOverdue } from "@/lib/task-overdue";
import { TASK_STATUSES, type TaskStatus } from "@/lib/task-status";
import { taskSchema } from "@/lib/validations";
import { defaultMissionColor } from "@/lib/mission-color";

export async function GET(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const status = searchParams.get("status");
  const overdue = searchParams.get("overdue");

  const allTasks = await db.query.tasks.findMany({
    where: eq(tasks.festivalId, session!.festivalId),
    with: { volunteers: { with: { user: true } }, location: true },
  });

  let filtered = allTasks;

  if (userId) {
    filtered = filtered.filter((t) => t.volunteers.some((v) => v.userId === userId));
  }

  if (status && TASK_STATUSES.includes(status as TaskStatus)) {
    filtered = filtered.filter((t) => t.status === status);
  }

  if (overdue === "true") {
    filtered = filtered.filter((t) =>
      isTaskOverdue(t.endAt, t.status as TaskStatus),
    );
  }

  return NextResponse.json(filtered.map(withTaskOverdue));
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
  const color = data.color ?? defaultMissionColor(data.title);

  await db.insert(tasks).values({
    id,
    festivalId: session!.festivalId,
    title: data.title,
    description: data.description,
    locationId: data.locationId || null,
    startAt: data.startAt,
    endAt: data.endAt,
    status: data.status ?? "a_faire",
    color,
  });

  if (volunteers?.length) {
    await db.insert(taskVolunteers).values(
      mapTaskVolunteerInserts(id, volunteers),
    );
  }

  const created = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: { volunteers: { with: { user: true } }, location: true },
  });
  return NextResponse.json(withTaskOverdue(created!), { status: 201 });
}
