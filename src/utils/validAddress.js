import { Bech32 } from "@iov/encoding";

export default function isValidAddress(address) {
    try {
      const { prefix, data } = Bech32.decode(address);
      if (prefix !== "secret") {
        return false;
      }
      return data.length === 20;
    } catch {
      return false;
    }
  }