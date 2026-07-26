import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireSession, requireAdmin } from "@/lib/api-helpers";
import { hashPin } from "@/lib/auth/hash";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { withoutPinHash } from "@/lib/user-sanitize";
import { userSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const item = await db.query.users.findFirst({
    where: and(eq(users.id, id), eq(users.festivalId, session!.festivalId)),
  });
  if (!item) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  return NextResponse.json(withoutPinHash(item));
}

export async function PUT(request: Request, { params }: Params) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await request.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    phone: parsed.data.phone,
    isAdmin: parsed.data.isAdmin,
  };
  if (parsed.data.pin) {
    updateData.pinHash = await hashPin(parsed.data.pin);
  }

  await db
    .update(users)
    .set(updateData)
    .where(and(eq(users.id, id), eq(users.festivalId, session!.festivalId)));

  const updated = await db.query.users.findFirst({ where: eq(users.id, id) });
  return NextResponse.json(withoutPinHash(updated!));
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  if (id === session!.userId) {
    return NextResponse.json({ error: "Impossible de supprimer votre propre compte" }, { status: 400 });
  }

  await db
    .delete(users)
    .where(and(eq(users.id, id), eq(users.festivalId, session!.festivalId)));

  return NextResponse.json({ success: true });
}
