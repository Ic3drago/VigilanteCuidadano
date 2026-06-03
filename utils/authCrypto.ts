/**
 * VigilanteCiudadano - Client & Edge Safe Auth Crypto Utilities
 * Location: utils/authCrypto.ts
 * Designed to be 100% compatible with Edge runtime (Middleware) and Client Components.
 * Does NOT import Node.js native modules.
 */

const SESSION_SECRET = process.env.SESSION_SECRET || 'VC-Bolivia-GovTech-Super-Secret-Token-Signing-Key-2026';

/* ────────────────────────── SESSION TOKEN METHODS ────────────────────────── */

// Base64URL encoding/decoding helper functions that are 100% compatible with Edge runtime
function base64urlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binString = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  return btoa(binString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binString = atob(base64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Convert signature buffer to hex/base64url safely in edge runtime
function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binString = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  return btoa(binString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlToArrayBuffer(str: string): ArrayBuffer {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binString = atob(base64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Get the cryptographic key for HMAC using standard SubtleCrypto
async function getHmacKey(): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(SESSION_SECRET);
  return await globalThis.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Creates an HMAC-SHA256 signed session token containing payload.
 */
export async function createSessionToken(payload: any): Promise<string> {
  const payloadStr = JSON.stringify(payload);
  const base64Payload = base64urlEncode(payloadStr);
  const key = await getHmacKey();
  
  const signatureBuffer = await globalThis.crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(base64Payload)
  );

  const signatureBase64url = arrayBufferToBase64url(signatureBuffer);
  return `${base64Payload}.${signatureBase64url}`;
}

/**
 * Verifies an HMAC-SHA256 signed session token and returns the payload.
 * Returns null if the signature is invalid or token is corrupt.
 */
export async function verifySessionToken(token: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [base64Payload, signatureBase64url] = parts;

    const key = await getHmacKey();
    const signatureBuffer = base64urlToArrayBuffer(signatureBase64url);

    const isValid = await globalThis.crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      new TextEncoder().encode(base64Payload)
    );

    if (!isValid) return null;

    const decodedPayloadStr = base64urlDecode(base64Payload);
    return JSON.parse(decodedPayloadStr);
  } catch (error) {
    console.error('Session Verification Failed:', error);
    return null;
  }
}
