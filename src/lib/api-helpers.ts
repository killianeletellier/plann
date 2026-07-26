import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireAdmin() {
  const { session, error } = await requireSession();
  if (error) return { session: null, error };
  if (!session!.isAdmin) {
    return {
      session: null,
      error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
