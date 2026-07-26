import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireSession, requireAdmin } from "@/lib/api-helpers";
import { db } from "@/lib/db/client";
import { volunteerRoles } from "@/lib/db/schema";
import { volunteerRoleSchema } from "@/lib/validations";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const items = await db.query.volunteerRoles.findMany({
    where: eq(volunteerRoles.festivalId, session!.festivalId),
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = volunteerRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const id = uuidv4();
  await db.insert(volunteerRoles).values({
    id,
    festivalId: session!.festivalId,
    name: parsed.data.name,
  });

  const created = await db.query.volunteerRoles.findFirst({
    where: eq(volunteerRoles.id, id),
  });
  return NextResponse.json(created, { status: 201 });
}
