/**
 * VigilanteCiudadano - Cryptographic Facade (Zero-Knowledge Architecture)
 * Location: utils/cryptoFacade.ts
 * Role: Principal Software Architect & Cybersecurity Expert
 * 
 * DESIGN PATTERN: FACADE
 * This module abstracts the complex Web Crypto API interfaces into simple, 
 * clean, and strictly typed operations for Zero-Knowledge clients.
 * 
 * ALGORITHMS:
 * - Key Derivation: PBKDF2 with SHA-256 (100,000 iterations).
 * - Symmetric Encryption: AES-GCM (256-bit key).
 */

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getCrypto(): any {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto) {
    return (globalThis as any).crypto;
  }
  return null;
}

// Static salt used to derive a consistent key from a password when a single argument is required
const STATIC_SALT = textEncoder.encode("VigilanteCiudadanoBoliviaGovTechSalt-2026");

/**
 * Encodes an ArrayBuffer into a Base64 string.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof window !== 'undefined' ? btoa(binary) : Buffer.from(buffer).toString('base64');
}

/**
 * Decodes a Base64 string into an ArrayBuffer.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = typeof window !== 'undefined' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generates an AES-GCM 256-bit CryptoKey derived from a citizen password using PBKDF2.
 * Exposes a clean, single-argument signature for Facade abstraction.
 * 
 * @param password The citizen password/passphrase.
 * @returns A Promise resolving to the derived CryptoKey.
 */
export async function generarClave(password: string): Promise<CryptoKey> {
  try {
    const crypto = getCrypto();
    if (!crypto || !crypto.subtle) {
      throw new Error('Web Crypto API is not supported in this environment.');
    }

    // Import the raw password text as a cryptographic key material source
    const rawKeyMaterial = await crypto.subtle.importKey(
      'raw',
      textEncoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive a symmetric 256-bit AES-GCM key
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: STATIC_SALT,
        iterations: 100000,
        hash: 'SHA-256'
      },
      rawKeyMaterial,
      { name: 'AES-GCM', length: 256 },
      false, // Key cannot be exported from memory for maximum client security
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('PBKDF2 Key Derivation Failed:', error);
    throw new Error('Error al generar la clave criptográfica local.');
  }
}

/**
 * Encrypts a plaintext string using AES-GCM 256-bit with the derived CryptoKey.
 * 
 * @param texto The plaintext string to encrypt.
 * @param clave The derived AES-GCM CryptoKey.
 * @returns A Promise resolving to an object containing the ciphertext (base64) and the IV (base64).
 */
export async function cifrarTexto(
  texto: string,
  clave: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  try {
    const crypto = getCrypto();
    if (!crypto || !crypto.subtle) {
      throw new Error('Web Crypto API is not supported in this environment.');
    }

    // Generate a secure random 12-byte initialization vector (IV) for AES-GCM
    const iv = (crypto as any).getRandomValues(new Uint8Array(12));

    // Perform symmetric encryption
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      clave,
      textEncoder.encode(texto)
    );

    return {
      ciphertext: arrayBufferToBase64(encryptedBuffer),
      iv: arrayBufferToBase64(iv)
    };
  } catch (error) {
    console.error('AES-GCM Encryption Failed:', error);
    throw new Error('Error al cifrar el texto: Fallo en la operación simétrica.');
  }
}

/**
 * Decrypts a base64 ciphertext string using AES-GCM 256-bit with the derived CryptoKey.
 * 
 * @param ciphertext Base64 encoded ciphertext string.
 * @param iv Base64 encoded initialization vector.
 * @param clave The derived AES-GCM CryptoKey.
 * @returns A Promise resolving to the original decrypted plaintext string.
 */
export async function descifrarTexto(
  ciphertext: string,
  iv: string,
  clave: CryptoKey
): Promise<string> {
  try {
    const crypto = getCrypto();
    if (!crypto || !crypto.subtle) {
      throw new Error('Web Crypto API is not supported in this environment.');
    }

    const ivBytes = new Uint8Array(base64ToArrayBuffer(iv));
    const cipherBytes = base64ToArrayBuffer(ciphertext);

    // Perform symmetric decryption
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes
      },
      clave,
      cipherBytes
    );

    return textDecoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('AES-GCM Decryption Failed:', error);
    throw new Error('Error al descifrar el texto: Clave incorrecta o paquete corrupto.');
  }
}

/**
 * Generates a SHA-256 hash of a text string for integrity verification.
 * 
 * @param texto The plaintext string to hash.
 * @returns A Promise resolving to the hex representation of the SHA-256 hash.
 */
export async function generarHashIntegridad(texto: string): Promise<string> {
  try {
    const crypto = getCrypto();
    if (!crypto || !crypto.subtle) {
      throw new Error('Web Crypto API is not supported in this environment.');
    }

    const msgBuffer = textEncoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('SHA-256 Hashing Failed:', error);
    throw new Error('Error al generar el hash de integridad.');
  }
}

