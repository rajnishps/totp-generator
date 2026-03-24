/**
 * Server-side encryption for TOTP secrets.
 * Key = HMAC-SHA256(HASH_SECRET, userId) → AES-256-GCM.
 * Runs only in API routes (Node.js runtime). Never imported by client code.
 */

import { createHmac, createCipheriv, createDecipheriv, randomBytes } from "crypto"

const IV_LENGTH = 12 // 96-bit IV for AES-GCM
const AUTH_TAG_LENGTH = 16 // 128-bit GCM auth tag

function deriveUserKey(userId: string): Buffer {
  const secret = process.env.HASH_SECRET
  if (!secret) throw new Error("HASH_SECRET env variable is not set")
  return createHmac("sha256", secret).update(userId).digest()
}

export function encryptSecret(
  plaintext: string,
  userId: string,
): { ciphertext: string; iv: string } {
  const key = deriveUserKey(userId)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv("aes-256-gcm", key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  // Append auth tag to ciphertext for integrity verification on decrypt
  const combined = Buffer.concat([encrypted, authTag])

  return {
    ciphertext: combined.toString("base64"),
    iv: iv.toString("base64"),
  }
}

export function decryptSecret(
  ciphertext: string,
  iv: string,
  userId: string,
): string {
  const key = deriveUserKey(userId)
  const combined = Buffer.from(ciphertext, "base64")
  const ivBuf = Buffer.from(iv, "base64")

  // Split auth tag from the end of combined buffer
  const encrypted = combined.subarray(0, combined.length - AUTH_TAG_LENGTH)
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH)

  const decipher = createDecipheriv("aes-256-gcm", key, ivBuf)
  decipher.setAuthTag(authTag)

  return decipher.update(encrypted) + decipher.final("utf8")
}
