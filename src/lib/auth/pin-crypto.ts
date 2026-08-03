import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret =
    process.env.PIN_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production"
      ? null
      : "plann-dev-secret-change-in-production");
  if (!secret) {
    throw new Error("PIN_ENCRYPTION_KEY ou JWT_SECRET requis pour le chiffrement des PIN");
  }
  return scryptSync(secret, "plann-pin-salt", 32);
}

export function encryptPin(pin: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(pin, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptPin(encrypted: string): string {
  const key = getKey();
  const buf = Buffer.from(encrypted, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const data = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
