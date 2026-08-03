import { encryptPin } from "./pin-crypto";
import { hashPin } from "./hash";

export async function preparePinForStorage(pin: string): Promise<{
  pinHash: string;
  pinEncrypted: string;
}> {
  return {
    pinHash: await hashPin(pin),
    pinEncrypted: encryptPin(pin),
  };
}
