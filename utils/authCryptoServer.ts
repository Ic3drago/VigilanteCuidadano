/**
 * VigilanteCiudadano - Server-Only Authentication Crypto Utilities
 * Location: utils/authCryptoServer.ts
 * Designed to be imported only inside Node.js Server API routes (e.g. login).
 */

import crypto from 'crypto';

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha256';

/**
 * Hashes a PIN or password using PBKDF2-HMAC-SHA256 with a unique salt.
 * 
 * @param pin The raw PIN or password string.
 * @param salt The unique cryptographic salt hex string.
 * @returns The hex representation of the derived key.
 */
export function hashPin(pin: string, salt: string): string {
  const hash = crypto.pbkdf2Sync(pin, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return hash.toString('hex');
}

/**
 * Generates a cryptographically secure 16-byte random salt.
 * 
 * @returns A hex string of the salt.
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}
