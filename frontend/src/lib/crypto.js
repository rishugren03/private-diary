/**
 * Zero-knowledge crypto helpers using Web Crypto API (AES-GCM + PBKDF2)
 * The encryption key is NEVER sent to the server.
 */

/**
 * Derive a 256-bit AES-GCM key from a passphrase + salt using PBKDF2.
 * The key is NON-EXTRACTABLE — JS code (including XSS payloads) cannot
 * read the raw key bytes. It can only be used for encrypt/decrypt operations.
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
    false,        // NON-EXTRACTABLE — prevents XSS from stealing the key
    ['encrypt', 'decrypt']
  );
}

/**
 * Hash a password with SHA-256 for server-side authentication.
 * The server receives this hash instead of the raw password, ensuring
 * it can never derive the user's AES encryption key (which uses the raw password).
 * @param {string} password - the user's raw password
 * @returns {Promise<string>} hex-encoded SHA-256 hash
 */
export async function hashPasswordForAuth(password) {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(password));
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
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

// ─── key verification sentinel ──────────────────────────────────────────────

/**
 * Encrypt a known sentinel value with the given key.
 * Store the returned JSON in localStorage so unlock() can verify future passwords.
 * @param {CryptoKey} key
 * @returns {Promise<string>} JSON string { iv, ciphertext }
 */
export async function createKeyVerifier(key) {
  const result = await encrypt(key, 'memoria-key-ok');
  return JSON.stringify(result);
}

/**
 * Attempt to decrypt & verify the stored sentinel.
 * Throws if the key is wrong (i.e. wrong password was entered).
 * @param {CryptoKey} key
 * @param {string} verifierJson  JSON string produced by createKeyVerifier()
 */
export async function verifyKey(key, verifierJson) {
  const { iv, ciphertext } = JSON.parse(verifierJson);
  const plaintext = await decrypt(key, iv, ciphertext);
  if (plaintext !== 'memoria-key-ok') {
    throw new Error('Key verification failed: sentinel mismatch');
  }
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
