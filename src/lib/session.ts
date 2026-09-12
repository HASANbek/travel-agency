// Works in both Node and Edge (middleware) runtimes — uses Web Crypto only, no Node-only APIs.
const SECRET = process.env.AUTH_SECRET || "travel-agency-dev-secret-change-me-please-32c";
export const SESSION_COOKIE = "ta_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getKey() {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export type SessionPayload = {
  uid: number;
  email: string;
  name: string;
  role: string;
  exp: number;
};

export async function signSession(payload: SessionPayload): Promise<string> {
  const key = await getKey();
  const enc = new TextEncoder();
  const payloadPart = base64url(enc.encode(JSON.stringify(payload)));
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payloadPart));
  const sigPart = base64url(new Uint8Array(sigBuf));
  return `${payloadPart}.${sigPart}`;
}

export async function verifySession(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadPart, sigPart] = parts;
  try {
    const key = await getKey();
    const enc = new TextEncoder();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlToBytes(sigPart) as BufferSource,
      enc.encode(payloadPart)
    );
    if (!valid) return null;
    const payload: SessionPayload = JSON.parse(
      new TextDecoder().decode(base64urlToBytes(payloadPart))
    );
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
