import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireSession, requireAdmin } from "@/lib/api-helpers";
import { preparePinForStorage } from "@/lib/auth/pin-store";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { withoutPinHash } from "@/lib/user-sanitize";
import { userSchema } from "@/lib/validations";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const items = await db.query.users.findMany({
    where: eq(users.festivalId, session!.festivalId),
  });
  return NextResponse.json(items.map(withoutPinHash));
}

export async function POST(request: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!parsed.data.pin) {
    return NextResponse.json({ error: "PIN requis" }, { status: 400 });
  }

  const id = uuidv4();
  const { pinHash, pinEncrypted } = await preparePinForStorage(parsed.data.pin);
  await db.insert(users).values({
    id,
    festivalId: session!.festivalId,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    phone: parsed.data.phone,
    pinHash,
    pinEncrypted,
    isAdmin: parsed.data.isAdmin,
  });

  const created = await db.query.users.findFirst({ where: eq(users.id, id) });
  return NextResponse.json(withoutPinHash(created!), { status: 201 });
}
