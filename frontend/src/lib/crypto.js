/**
 * Zero-knowledge crypto helpers using Web Crypto API (AES-GCM + PBKDF2)
 * The encryption key is NEVER sent to the server.
 */

/**
 * Derive a 256-bit AES-GCM key from a passphrase + salt using PBKDF2.
 * @param {string} passphrase  - user's password
 * @param {string} saltB64     - base64-encoded 32-byte salt from server
 */
export async function deriveKey(passphrase, saltB64) {
  const enc = new TextEncoder();
  const salt = base64ToBuffer(saltB64);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 310_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,         // extractable for session persistence across F5 refresh
    ['encrypt', 'decrypt']
  );
}

/**
 * Export raw AES CryptoKey to Base64 string for sessionStorage caching.
 */
export async function exportKeyB64(key) {
  const exported = await crypto.subtle.exportKey('raw', key);
  return bufferToBase64(new Uint8Array(exported));
}

/**
 * Import raw Base64 string back into an AES CryptoKey object.
 */
export async function importKeyB64(b64) {
  const raw = base64ToBuffer(b64);
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plain-text string.
 * @returns {{ iv: string, ciphertext: string }} both Base64-encoded
 */
export async function encrypt(key, plaintext) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  return {
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(new Uint8Array(ciphertextBuffer)),
  };
}

/**
 * Decrypt a Base64-encoded ciphertext.
 * @returns {string} plaintext
 */
export async function decrypt(key, ivB64, ciphertextB64) {
  const iv = base64ToBuffer(ivB64);
  const ciphertext = base64ToBuffer(ciphertextB64);

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintextBuffer);
}

// ─── helpers ────────────────────────────────────────────────────────────────

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...buffer));
}

function base64ToBuffer(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
