import type { users } from "@/lib/db/schema";

type UserRow = typeof users.$inferSelect;

export function withoutPinHash(user: UserRow) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- pinHash intentionally stripped
  const { pinHash, ...safe } = user;
  return safe;
}
