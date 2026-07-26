import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireSession, requireAdmin } from "@/lib/api-helpers";
import { db } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";
import { withSortedSlots } from "@/lib/dates";
import { postSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const item = await db.query.posts.findFirst({
    where: and(eq(posts.id, id), eq(posts.festivalId, session!.festivalId)),
    with: { location: true, slots: { with: { volunteers: { with: { user: true } } } } },
  });
  if (!item) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  return NextResponse.json(withSortedSlots(item));
}

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await request.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await db
    .update(posts)
    .set(parsed.data)
    .where(and(eq(posts.id, id), eq(posts.festivalId, session!.festivalId)));

  const updated = await db.query.posts.findFirst({
    where: eq(posts.id, id),
    with: { location: true, slots: { with: { volunteers: { with: { user: true } } } } },
  });
  return NextResponse.json(withSortedSlots(updated!));
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  await db
    .delete(posts)
    .where(and(eq(posts.id, id), eq(posts.festivalId, session!.festivalId)));

  return NextResponse.json({ success: true });
}
