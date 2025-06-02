// Browser-compatible encryption using Web Crypto API with Node.js fallback
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "fallback-key-for-development-only-not-secure"

export interface EncryptedData {
  encrypted: string
  iv: string
  tag: string
}

// Check if we're in Node.js environment
const isNodeJS = typeof process !== "undefined" && process.versions && process.versions.node

async function getKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32))

  if (typeof crypto !== "undefined" && crypto.subtle) {
    return await crypto.subtle.importKey("raw", keyData, { name: "AES-GCM" }, false, ["encrypt", "decrypt"])
  }

  throw new Error("Crypto API not available")
}

export async function encryptApiKey(apiKey: string): Promise<EncryptedData> {
  if (!apiKey) {
    throw new Error("API key cannot be empty")
  }

  try {
    // Use Web Crypto API (works in both Node.js and browser)
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const key = await getKey()
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encoder = new TextEncoder()
      const data = encoder.encode(apiKey)

      const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data)

      return {
        encrypted: Array.from(new Uint8Array(encrypted))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""),
        iv: Array.from(iv)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""),
        tag: "", // GCM includes auth tag in encrypted data
      }
    }

    // Fallback: simple base64 encoding (not secure, for development only)
    console.warn("⚠️ Using insecure fallback encryption - not suitable for production")
    const encoded = btoa(apiKey)
    return {
      encrypted: encoded,
      iv: "fallback",
      tag: "fallback",
    }
  } catch (error) {
    console.error("Encryption failed:", error)
    throw new Error("Failed to encrypt API key")
  }
}

export async function decryptApiKey(encryptedData: EncryptedData): Promise<string> {
  try {
    const { encrypted, iv, tag } = encryptedData

    // Handle fallback encryption
    if (iv === "fallback" && tag === "fallback") {
      console.warn("⚠️ Using insecure fallback decryption")
      return atob(encrypted)
    }

    // Use Web Crypto API
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const key = await getKey()
      const ivArray = new Uint8Array(iv.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) || [])
      const encryptedArray = new Uint8Array(encrypted.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) || [])

      const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivArray }, key, encryptedArray)

      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    }

    throw new Error("Crypto API not available")
  } catch (error) {
    console.error("Failed to decrypt API key:", error)
    throw new Error("Failed to decrypt API key")
  }
}

// Enhanced encrypt/decrypt functions with better compatibility
export async function encrypt(text: string): Promise<string> {
  if (!text) {
    throw new Error("Text cannot be empty")
  }

  try {
    const encryptedData = await encryptApiKey(text)
    return JSON.stringify(encryptedData)
  } catch (error) {
    console.error("Encryption failed:", error)
    throw new Error("Failed to encrypt data")
  }
}

export async function decrypt(encryptedText: string): Promise<string> {
  if (!encryptedText) {
    throw new Error("Encrypted text cannot be empty")
  }

  try {
    const data = JSON.parse(encryptedText)
    return await decryptApiKey(data)
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
export async function prepareApiKeyForStorage(apiKey: string): Promise<string> {
  const encryptedData = await encryptApiKey(apiKey)
  return JSON.stringify(encryptedData)
}

// Helper to safely decrypt API keys from storage
export async function retrieveApiKeyFromStorage(encryptedString: string): Promise<string> {
  try {
    const encryptedData = JSON.parse(encryptedString)
    if (!isEncryptedData(encryptedData)) {
      throw new Error("Invalid encrypted data format")
    }
    return await decryptApiKey(encryptedData)
  } catch (error) {
    console.error("Failed to retrieve API key from storage:", error)
    throw new Error("Failed to retrieve API key")
  }
}

// Migration helper for existing plain text keys
export async function migrateExistingApiKey(plainTextKey: string): Promise<string> {
  console.log("🔄 Migrating existing API key to encrypted format...")
  return await encrypt(plainTextKey)
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
export async function safeDecrypt(keyData: string): Promise<string> {
  if (!keyData) {
    throw new Error("Key data cannot be empty")
  }

  // If it's already plain text (not encrypted), return as-is but log warning
  if (!isKeyEncrypted(keyData)) {
    console.warn("⚠️ Found unencrypted API key - should be migrated")
    return keyData
  }

  // Otherwise decrypt normally
  return await decrypt(keyData)
}

// Synchronous fallback functions for compatibility
export function encryptSync(text: string): string {
  console.warn("⚠️ Using synchronous fallback encryption - not secure")
  return btoa(text)
}

export function decryptSync(encryptedText: string): string {
  console.warn("⚠️ Using synchronous fallback decryption - not secure")
  try {
    return atob(encryptedText)
  } catch {
    // If it's not base64, assume it's plain text
    return encryptedText
  }
}

export function safeDecryptSync(keyData: string): string {
  if (!keyData) {
    throw new Error("Key data cannot be empty")
  }

  // If it looks like JSON, try to parse and decrypt
  if (keyData.startsWith("{")) {
    try {
      const parsed = JSON.parse(keyData)
      if (parsed.encrypted && parsed.iv === "fallback") {
        return atob(parsed.encrypted)
      }
    } catch {
      // Fall through to plain text handling
    }
  }

  // Try base64 decode
  try {
    return atob(keyData)
  } catch {
    // If not base64, assume plain text
    console.warn("⚠️ Found unencrypted API key")
    return keyData
  }
}
