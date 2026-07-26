import {
  addMinutes,
  eachDayOfInterval,
  format,
  parseISO,
  setHours,
  setMinutes,
} from "date-fns";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireAdmin } from "@/lib/api-helpers";
import { db } from "@/lib/db/client";
import { posts, slots } from "@/lib/db/schema";
import { slotGenerateSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = slotGenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, parsed.data.postId),
  });
  if (!post || post.festivalId !== session!.festivalId) {
    return NextResponse.json({ error: "Poste invalide" }, { status: 400 });
  }

  const { startDate, endDate, dailyStartTime, dailyEndTime, slotDurationMinutes, days } =
    parsed.data;

  const [startH, startM] = dailyStartTime.split(":").map(Number);
  const [endH, endM] = dailyEndTime.split(":").map(Number);

  const interval = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });

  const created: string[] = [];

  for (const day of interval) {
    if (!days.includes(day.getDay())) continue;

    let cursor = setMinutes(setHours(day, startH), startM);
    const dayEnd = setMinutes(setHours(day, endH), endM);

    while (addMinutes(cursor, slotDurationMinutes) <= dayEnd) {
      const slotEnd = addMinutes(cursor, slotDurationMinutes);
      const id = uuidv4();
      await db.insert(slots).values({
        id,
        postId: parsed.data.postId,
        startAt: cursor.toISOString(),
        endAt: slotEnd.toISOString(),
      });
      created.push(id);
      cursor = slotEnd;
    }
  }

  return NextResponse.json({
    success: true,
    count: created.length,
    message: `${created.length} créneaux générés du ${format(parseISO(startDate), "dd/MM/yyyy")} au ${format(parseISO(endDate), "dd/MM/yyyy")}`,
  });
}
