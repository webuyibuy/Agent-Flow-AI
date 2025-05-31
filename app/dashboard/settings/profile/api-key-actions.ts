"use server"

import { getSupabaseFromServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { prepareApiKeyForStorage, retrieveApiKeyFromStorage } from "@/lib/encryption"
import { getDefaultUserId } from "@/lib/default-user"

export interface ApiKeyInfo {
  service_id: string
  isSet: boolean
  // We don't return the key value itself to the client for listing
}

export interface ApiKeyActionResult {
  success?: boolean
  error?: string
  message?: string
  keys?: ApiKeyInfo[]
  updatedServiceId?: string
  isSet?: boolean
}

// List of known services the UI can manage
const KNOWN_SERVICE_IDS = ["openai", "anthropic", "n8n_url", "lyzr_api_key"]

/**
 * Fetches the status of API keys for all known services for the current user.
 */
export async function getApiKeys(): Promise<ApiKeyActionResult> {
  let userId: string
  try {
    userId = await getDefaultUserId()
  } catch (error) {
    return { error: "Authentication required." }
  }

  try {
    const supabase = getSupabaseFromServer()
    const { data: storedKeys, error: dbError } = await supabase
      .from("user_api_keys")
      .select("service_id")
      .eq("user_id", userId)

    if (dbError) {
      console.error("Error fetching API keys:", dbError)
      return { error: "Failed to fetch API key statuses." }
    }

    const keysStatus: ApiKeyInfo[] = KNOWN_SERVICE_IDS.map((serviceId) => ({
      service_id: serviceId,
      isSet: storedKeys.some((key) => key.service_id === serviceId),
    }))

    return { success: true, keys: keysStatus }
  } catch (e) {
    console.error("Unexpected error in getApiKeys:", e)
    return { error: "An unexpected error occurred while fetching API key statuses." }
  }
}

/**
 * Saves or updates an API key for a specific service for the current user.
 * Now with proper encryption!
 */
export async function saveApiKey(serviceId: string, apiKeyValue: string): Promise<ApiKeyActionResult> {
  const supabase = getSupabaseAdmin()
  let userId: string
  try {
    userId = await getDefaultUserId()
  } catch (error) {
    return { error: "Authentication required." }
  }

  if (!serviceId || !apiKeyValue.trim()) {
    return { error: "Service ID and API key value are required." }
  }

  if (!KNOWN_SERVICE_IDS.includes(serviceId)) {
    return { error: "Invalid service ID." }
  }

  try {
    // Encrypt the API key before storing
    const encryptedApiKey = prepareApiKeyForStorage(apiKeyValue.trim())

    const { error: upsertError } = await supabase.from("user_api_keys").upsert(
      {
        user_id: userId,
        service_id: serviceId,
        api_key_value: encryptedApiKey, // Now storing encrypted data
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id, service_id" },
    )

    if (upsertError) {
      console.error(`Error saving API key for ${serviceId}:`, upsertError)
      return { error: `Failed to save API key for ${serviceId}. ${upsertError.message}` }
    }

    revalidatePath("/dashboard/settings/profile")
    return {
      success: true,
      message: `API key for ${serviceId} saved securely.`,
      updatedServiceId: serviceId,
      isSet: true,
    }
  } catch (e) {
    console.error("Unexpected error in saveApiKey:", e)
    return { error: "An unexpected error occurred while saving the API key." }
  }
}

/**
 * Removes an API key for a specific service for the current user.
 */
export async function removeApiKey(serviceId: string): Promise<ApiKeyActionResult> {
  const supabase = getSupabaseAdmin()
  let userId: string
  try {
    userId = await getDefaultUserId()
  } catch (error) {
    return { error: "Authentication required." }
  }

  if (!serviceId) {
    return { error: "Service ID is required." }
  }

  if (!KNOWN_SERVICE_IDS.includes(serviceId)) {
    return { error: "Invalid service ID." }
  }

  try {
    const { error: deleteError } = await supabase
      .from("user_api_keys")
      .delete()
      .eq("user_id", userId)
      .eq("service_id", serviceId)

    if (deleteError) {
      console.error(`Error removing API key for ${serviceId}:`, deleteError)
      return { error: `Failed to remove API key for ${serviceId}. ${deleteError.message}` }
    }

    revalidatePath("/dashboard/settings/profile")
    return {
      success: true,
      message: `API key for ${serviceId} removed successfully.`,
      updatedServiceId: serviceId,
      isSet: false,
    }
  } catch (e) {
    console.error("Unexpected error in removeApiKey:", e)
    return { error: "An unexpected error occurred while removing the API key." }
  }
}

/**
 * Retrieves and decrypts an API key for internal use (server-side only)
 */
export async function getDecryptedApiKey(serviceId: string, userId?: string): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  let effectiveUserId = userId

  if (!effectiveUserId) {
    try {
      effectiveUserId = await getDefaultUserId()
    } catch (error) {
      console.error("Authentication required to retrieve API key")
      return null
    }
  }

  try {
    const { data: keyData, error } = await supabase
      .from("user_api_keys")
      .select("api_key_value")
      .eq("user_id", effectiveUserId)
      .eq("service_id", serviceId)
      .single()

    if (error || !keyData) {
      console.log(`No API key found for service ${serviceId}`)
      return null
    }

    // Decrypt the API key
    const decryptedKey = retrieveApiKeyFromStorage(keyData.api_key_value)
    return decryptedKey
  } catch (e) {
    console.error(`Error retrieving API key for ${serviceId}:`, e)
    return null
  }
}
