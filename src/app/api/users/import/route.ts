import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireAdmin } from "@/lib/api-helpers";
import { generateRandomPin } from "@/lib/auth/pin-generate";
import { preparePinForStorage } from "@/lib/auth/pin-store";
import { parseVolunteersCsv } from "@/lib/csv-import";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { withoutPinHash } from "@/lib/user-sanitize";

export async function POST(request: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier CSV requis" }, { status: 400 });
  }

  const content = await file.text();
  const { rows, errors } = parseVolunteersCsv(content);

  if (errors.length > 0 && rows.length === 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  const imported: Array<{
    user: ReturnType<typeof withoutPinHash>;
    pin: string;
  }> = [];

  for (const row of rows) {
    const pin = generateRandomPin();
    const { pinHash, pinEncrypted } = await preparePinForStorage(pin);
    const id = uuidv4();

    await db.insert(users).values({
      id,
      festivalId: session!.festivalId,
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone ?? null,
      pinHash,
      pinEncrypted,
      isAdmin: false,
    });

    const created = await db.query.users.findFirst({ where: eq(users.id, id) });
    imported.push({ user: withoutPinHash(created!), pin });
  }

  return NextResponse.json({
    imported: imported.length,
    volunteers: imported,
    warnings: errors.length > 0 ? errors : undefined,
  });
}
