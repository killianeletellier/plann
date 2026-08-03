import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireSession, requireAdmin } from "@/lib/api-helpers";
import { db } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";
import { withSortedSlots } from "@/lib/dates";
import { defaultMissionColor } from "@/lib/mission-color";
import { postSchema } from "@/lib/validations";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const items = await db.query.posts.findMany({
    where: eq(posts.festivalId, session!.festivalId),
    with: { location: true, slots: { with: { volunteers: { with: { user: true } } } } },
  });
  return NextResponse.json(items.map(withSortedSlots));
}

export async function POST(request: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const id = uuidv4();
  const color = parsed.data.color ?? defaultMissionColor(parsed.data.title);
  await db.insert(posts).values({
    id,
    festivalId: session!.festivalId,
    ...parsed.data,
    color,
  });

  const created = await db.query.posts.findFirst({
    where: eq(posts.id, id),
    with: { location: true, slots: { with: { volunteers: { with: { user: true } } } } },
  });
  return NextResponse.json(withSortedSlots(created!), { status: 201 });
}
