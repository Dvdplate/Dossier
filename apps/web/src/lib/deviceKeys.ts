export async function generateDeviceKeys() {
  const { privateKey, publicKey } = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );

  const privateJwk = (await crypto.subtle.exportKey("jwk", privateKey)) as JsonWebKey;
  const publicJwk = (await crypto.subtle.exportKey("jwk", publicKey)) as JsonWebKey;

  return { privateJwk, publicJwk };
}

export function makeDeviceCredential(args: {
  deviceId: string;
  nickname: string;
  privateJwk: JsonWebKey;
}) {
  return {
    deviceId: args.deviceId,
    nickname: args.nickname,
    privateKey: args.privateJwk,
  };
}

