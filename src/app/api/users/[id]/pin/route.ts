import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { decryptPin } from "@/lib/auth/pin-crypto";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const user = await db.query.users.findFirst({
    where: and(eq(users.id, id), eq(users.festivalId, session!.festivalId)),
    columns: { id: true, firstName: true, lastName: true, pinEncrypted: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  if (!user.pinEncrypted) {
    return NextResponse.json(
      {
        error:
          "PIN non récupérable — réinitialisez le PIN du bénévole pour activer la récupération",
      },
      { status: 404 },
    );
  }

  try {
    const pin = decryptPin(user.pinEncrypted);
    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      pin,
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible de déchiffrer le PIN — vérifiez PIN_ENCRYPTION_KEY" },
      { status: 500 },
    );
  }
}
