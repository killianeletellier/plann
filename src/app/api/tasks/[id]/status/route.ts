import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { db } from "@/lib/db/client";
import { tasks } from "@/lib/db/schema";
import { withTaskOverdue } from "@/lib/task-overdue";
import { taskStatusSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await request.json();
  const parsed = taskStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await db
    .update(tasks)
    .set({ status: parsed.data.status })
    .where(and(eq(tasks.id, id), eq(tasks.festivalId, session!.festivalId)));

  const updated = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: { volunteers: { with: { user: true } }, location: true },
  });

  if (!updated) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  return NextResponse.json(withTaskOverdue(updated));
}
