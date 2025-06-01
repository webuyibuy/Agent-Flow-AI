import crypto from "crypto"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "fallback-key-for-development-only-not-secure"
const ALGORITHM = "aes-256-gcm"

export interface EncryptedData {
  encrypted: string
  iv: string
  tag: string
}

export function encryptApiKey(apiKey: string): EncryptedData {
  if (!apiKey) {
    throw new Error("API key cannot be empty")
  }

  // Generate a random initialization vector
  const iv = crypto.randomBytes(16)

  // Create cipher with proper key derivation
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32)
  const cipher = crypto.createCipherGCM(ALGORITHM, key, iv)

  // Encrypt the API key
  let encrypted = cipher.update(apiKey, "utf8", "hex")
  encrypted += cipher.final("hex")

  // Get the authentication tag
  const tag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  }
}

export function decryptApiKey(encryptedData: EncryptedData): string {
  try {
    const { encrypted, iv, tag } = encryptedData

    // Create decipher with proper key derivation
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32)
    const decipher = crypto.createDecipherGCM(ALGORITHM, key, Buffer.from(iv, "hex"))
    decipher.setAuthTag(Buffer.from(tag, "hex"))

    // Decrypt the API key
    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Failed to decrypt API key:", error)
    throw new Error("Failed to decrypt API key")
  }
}

// Enhanced encrypt/decrypt functions with better security
export function encrypt(text: string): string {
  if (!text) {
    throw new Error("Text cannot be empty")
  }

  try {
    const iv = crypto.randomBytes(16)
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32)
    const cipher = crypto.createCipherGCM(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")

    const tag = cipher.getAuthTag()

    // Combine iv, tag, and encrypted data
    const result = {
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
      encrypted: encrypted,
    }

    return JSON.stringify(result)
  } catch (error) {
    console.error("Encryption failed:", error)
    throw new Error("Failed to encrypt data")
  }
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    throw new Error("Encrypted text cannot be empty")
  }

  try {
    const data = JSON.parse(encryptedText)
    const { iv, tag, encrypted } = data

    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32)
    const decipher = crypto.createDecipherGCM(ALGORITHM, key, Buffer.from(iv, "hex"))
    decipher.setAuthTag(Buffer.from(tag, "hex"))

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Decryption failed:", error)
    throw new Error("Failed to decrypt data")
  }
}

// Utility function to check if data is encrypted (has the expected structure)
export function isEncryptedData(data: any): data is EncryptedData {
  return (
    data &&
    typeof data === "object" &&
    typeof data.encrypted === "string" &&
    typeof data.iv === "string" &&
    typeof data.tag === "string"
  )
}

// Helper to safely encrypt API keys for storage
export function prepareApiKeyForStorage(apiKey: string): string {
  const encryptedData = encryptApiKey(apiKey)
  return JSON.stringify(encryptedData)
}

// Helper to safely decrypt API keys from storage
export function retrieveApiKeyFromStorage(encryptedString: string): string {
  try {
    const encryptedData = JSON.parse(encryptedString)
    if (!isEncryptedData(encryptedData)) {
      throw new Error("Invalid encrypted data format")
    }
    return decryptApiKey(encryptedData)
  } catch (error) {
    console.error("Failed to retrieve API key from storage:", error)
    throw new Error("Failed to retrieve API key")
  }
}

// Migration helper for existing plain text keys
export function migrateExistingApiKey(plainTextKey: string): string {
  console.log("🔄 Migrating existing API key to encrypted format...")
  return encrypt(plainTextKey)
}

// Validation helper to check if a key is already encrypted
export function isKeyEncrypted(keyData: string): boolean {
  try {
    const parsed = JSON.parse(keyData)
    return isEncryptedData(parsed) || (parsed.iv && parsed.tag && parsed.encrypted)
  } catch {
    return false
  }
}

// Safe decryption that handles both encrypted and plain text (for migration)
export function safeDecrypt(keyData: string): string {
  if (!keyData) {
    throw new Error("Key data cannot be empty")
  }

  // If it's already plain text (not encrypted), return as-is but log warning
  if (!isKeyEncrypted(keyData)) {
    console.warn("⚠️ Found unencrypted API key - should be migrated")
    return keyData
  }

  // Otherwise decrypt normally
  return decrypt(keyData)
}
