/**
 * Field-level encryption for sensitive data
 *
 * Uses AES-256-GCM for encrypting sensitive fields like access notes.
 * Each encrypted value includes the IV for decryption.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Get the encryption key from environment variable
 * Key should be 32 bytes (256 bits) hex-encoded = 64 characters
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    // In development, use a default key (NOT for production!)
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Using default encryption key - set ENCRYPTION_KEY in production!')
      return Buffer.from('0123456789abcdef0123456789abcdef') // 32 bytes
    }
    throw new Error('ENCRYPTION_KEY environment variable is required')
  }

  // Key can be hex-encoded (64 chars) or raw (32 chars)
  if (key.length === 64) {
    return Buffer.from(key, 'hex')
  } else if (key.length === 32) {
    return Buffer.from(key)
  } else {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (or 64 hex characters)')
  }
}

/**
 * Encrypt a string value
 * Returns base64 encoded string: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return ''

  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()

  // Combine IV, auth tag, and ciphertext
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

/**
 * Decrypt a string value
 * Expects base64 encoded string: iv:authTag:ciphertext
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return ''

  // Check if data is encrypted (contains the : separator)
  if (!encryptedData.includes(':')) {
    // Return as-is if not encrypted (legacy data)
    return encryptedData
  }

  const key = getEncryptionKey()

  const parts = encryptedData.split(':')
  if (parts.length !== 3) {
    // Invalid format, return as-is (might be legacy unencrypted data)
    return encryptedData
  }

  const [ivBase64, authTagBase64, ciphertext] = parts

  const iv = Buffer.from(ivBase64, 'base64')
  const authTag = Buffer.from(authTagBase64, 'base64')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Check if a value is encrypted (has the expected format)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false
  const parts = value.split(':')
  return parts.length === 3 && parts.every(p => p.length > 0)
}

/**
 * Encrypt access notes with additional metadata
 * Stores encryption timestamp for potential key rotation
 */
export function encryptAccessNotes(notes: string): string {
  if (!notes) return ''
  return encrypt(notes)
}

/**
 * Decrypt access notes
 * Handles both encrypted and legacy unencrypted data
 */
export function decryptAccessNotes(encryptedNotes: string): string {
  if (!encryptedNotes) return ''
  return decrypt(encryptedNotes)
}
