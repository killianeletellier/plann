import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireSession, requireAdmin } from "@/lib/api-helpers";
import { mapTaskVolunteerInserts } from "@/lib/api-volunteers";
import { db } from "@/lib/db/client";
import { taskVolunteers, tasks } from "@/lib/db/schema";
import { withTaskOverdue } from "@/lib/task-overdue";
import { taskSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const item = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, id), eq(tasks.festivalId, session!.festivalId)),
    with: { volunteers: { with: { user: true } }, location: true },
  });
  if (!item) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  return NextResponse.json(withTaskOverdue(item));
}

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await request.json();
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { volunteers, ...data } = parsed.data;

  await db
    .update(tasks)
    .set({
      title: data.title,
      description: data.description,
      locationId: data.locationId || null,
      startAt: data.startAt,
      endAt: data.endAt,
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
    })
    .where(and(eq(tasks.id, id), eq(tasks.festivalId, session!.festivalId)));

  await db.delete(taskVolunteers).where(eq(taskVolunteers.taskId, id));
  if (volunteers?.length) {
    await db.insert(taskVolunteers).values(
      mapTaskVolunteerInserts(id, volunteers),
    );
  }

  const updated = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: { volunteers: { with: { user: true } }, location: true },
  });
  return NextResponse.json(withTaskOverdue(updated!));
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.festivalId, session!.festivalId)));

  return NextResponse.json({ success: true });
}
