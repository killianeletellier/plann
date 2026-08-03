import type { users } from "@/lib/db/schema";

type UserRow = typeof users.$inferSelect;

export function withoutPinHash(user: UserRow) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- pin fields intentionally stripped
  const { pinHash, pinEncrypted, ...safe } = user;
  return safe;
}
