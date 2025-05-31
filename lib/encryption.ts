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

  // Create cipher
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)
  cipher.setAAD(Buffer.from("api-key-data"))

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

    // Create decipher
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
    decipher.setAAD(Buffer.from("api-key-data"))
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
