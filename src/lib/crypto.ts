/**
 * Zero-knowledge client-side encryption for TOTP secrets.
 * Uses Web Crypto API: PBKDF2 key derivation + AES-GCM encryption.
 * All operations run in the browser — the server never sees plaintext.
 */

const PBKDF2_ITERATIONS = 600_000
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits for AES-GCM

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function fromBase64(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

async function deriveKey(
  password: string,
  salt: ArrayBuffer,
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  )

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  )
}

export async function encryptSecret(
  plaintext: string,
  password: string,
): Promise<{ ciphertext: string; iv: string; salt: string }> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(password, salt.buffer)

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext),
  )

  return {
    ciphertext: toBase64(encrypted),
    iv: toBase64(iv.buffer),
    salt: toBase64(salt.buffer),
  }
}

export async function decryptSecret(
  ciphertext: string,
  iv: string,
  salt: string,
  password: string,
): Promise<string> {
  const key = await deriveKey(password, fromBase64(salt))
  const decoder = new TextDecoder()

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    key,
    fromBase64(ciphertext),
  )

  return decoder.decode(decrypted)
}
