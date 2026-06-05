function base64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
}

export function buildAuthMessage(method: string, pathWithQuery: string, timestampSeconds: number) {
  return `${method.toUpperCase()}\n${pathWithQuery}\n${timestampSeconds}`;
}

export async function verifyDeviceSignature(args: {
  publicKeyJwk: JsonWebKey;
  message: string;
  signatureB64: string;
}): Promise<boolean> {
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    args.publicKeyJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );

  return crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    base64ToBytes(args.signatureB64),
    new TextEncoder().encode(args.message),
  );
}

