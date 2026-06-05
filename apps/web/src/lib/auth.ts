const DEVICE_CREDENTIAL_KEY = "dossier-device-credential";

export interface DeviceCredential {
  deviceId: string;
  nickname: string;
  privateKey: JsonWebKey;
}

export function getDeviceCredential(): DeviceCredential | null {
  const raw = localStorage.getItem(DEVICE_CREDENTIAL_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DeviceCredential;
  } catch {
    return null;
  }
}

export function setDeviceCredential(cred: DeviceCredential) {
  localStorage.setItem(DEVICE_CREDENTIAL_KEY, JSON.stringify(cred));
}

export function clearDeviceCredential() {
  localStorage.removeItem(DEVICE_CREDENTIAL_KEY);
}
