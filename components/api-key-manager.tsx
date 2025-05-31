"use client"

import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useActionState, startTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Eye, EyeOff, Trash2, Save, Loader2, AlertCircle, AlertTriangle, CheckCircle, Shield } from "lucide-react"
import {
  getApiKeys,
  saveApiKey,
  removeApiKey,
  type ApiKeyActionResult,
} from "@/app/dashboard/settings/profile/api-key-actions"

interface ApiServiceUIData {
  id: string // Corresponds to service_id in DB
  name: string
  description: string
  isSet: boolean // This will now come from backend
  placeholder: string
}

// This defines the UI structure and static text for services.
// The `isSet` property will be dynamically updated from the backend.
const serviceDefinitions: Omit<ApiServiceUIData, "isSet">[] = [
  {
    id: "openai",
    name: "OpenAI API Key",
    description: "Used for GPT models and other OpenAI services.",
    placeholder: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  },
  {
    id: "anthropic",
    name: "Anthropic API Key",
    description: "Used for Claude models.",
    placeholder: "sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  },
  {
    id: "n8n_url",
    name: "n8n Instance URL",
    description: "URL for your self-hosted or cloud n8n instance.",
    placeholder: "https://your-n8n-instance.com",
  },
  {
    id: "lyzr_api_key",
    name: "Lyzr API Key",
    description: "API key for Lyzr agent orchestration.",
    placeholder: "lyzr_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  },
]

export default function ApiKeyManager() {
  const [services, setServices] = useState<ApiServiceUIData[]>([])
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null)

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [currentKeyValue, setCurrentKeyValue] = useState("")
  const [showKeyValue, setShowKeyValue] = useState(false)

  // Action state for save/remove operations
  const [actionResult, submitAction, isActionPending] = useActionState(
    async (previousState: ApiKeyActionResult | undefined, formData: FormData): Promise<ApiKeyActionResult> => {
      const serviceId = formData.get("serviceId") as string
      const actionType = formData.get("actionType") as "save" | "remove"
      const keyValue = formData.get("keyValue") as string | null

      let result: ApiKeyActionResult = {}
      if (actionType === "save" && keyValue !== null) {
        result = await saveApiKey(serviceId, keyValue)
      } else if (actionType === "remove") {
        result = await removeApiKey(serviceId)
      } else {
        return { error: "Invalid action." }
      }

      if (result.success && result.updatedServiceId) {
        // Update local state upon successful action
        setServices((prevServices) =>
          prevServices.map((s) => (s.id === result.updatedServiceId ? { ...s, isSet: result.isSet ?? s.isSet } : s)),
        )
        setEditingServiceId(null) // Close edit form on success
        setCurrentKeyValue("")
      }
      return result
    },
    undefined,
  )

  useEffect(() => {
    async function loadInitialKeys() {
      setIsLoadingInitial(true)
      setInitialLoadError(null)
      const result = await getApiKeys()
      if (result.success && result.keys) {
        const updatedServices = serviceDefinitions.map((def) => {
          const storedKeyInfo = result.keys?.find((k) => k.service_id === def.id)
          return { ...def, isSet: storedKeyInfo?.isSet || false }
        })
        setServices(updatedServices)
      } else {
        setInitialLoadError(result.error || "Failed to load API key statuses.")
      }
      setIsLoadingInitial(false)
    }
    loadInitialKeys()
  }, [])

  const handleEdit = (service: ApiServiceUIData) => {
    setEditingServiceId(service.id)
    setCurrentKeyValue("") // Clear previous value when starting edit
    setShowKeyValue(true) // Show input by default when editing
  }

  const handleCancelEdit = () => {
    setEditingServiceId(null)
    setCurrentKeyValue("")
    setShowKeyValue(false)
  }

  if (isLoadingInitial) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Keys & Integrations</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-[#007AFF]" />
          <p className="ml-2">Loading API Key settings...</p>
        </CardContent>
      </Card>
    )
  }

  if (initialLoadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Keys & Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Settings</AlertTitle>
            <AlertDescription>{initialLoadError}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          API Keys & Integrations
        </CardTitle>
        <CardDescription>
          Manage your API keys for LLMs and other services.
          <span className="font-semibold text-green-600 dark:text-green-400">
            {" "}
            All keys are now encrypted and stored securely.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert
          variant="default"
          className="bg-green-50 border-green-300 text-green-800 dark:bg-green-900/50 dark:border-green-600 dark:text-green-300"
        >
          <Shield className="h-4 w-4 !text-green-800 dark:!text-green-300" />
          <AlertTitle>Security Enhanced</AlertTitle>
          <AlertDescription>
            Your API keys are now encrypted using AES-256-GCM encryption before storage. They are automatically
            decrypted only when needed for agent operations. Never share your keys publicly.
          </AlertDescription>
        </Alert>

        {actionResult?.error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Operation Failed</AlertTitle>
            <AlertDescription>{actionResult.error}</AlertDescription>
          </Alert>
        )}
        {actionResult?.success && actionResult.message && (
          <Alert variant="default" className="mt-4 bg-green-50 border-green-200 text-green-700">
            <CheckCircle className="h-4 w-4 !text-green-700" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{actionResult.message}</AlertDescription>
          </Alert>
        )}

        {services.map((service) => (
          <form
            key={service.id}
            action={(formData) => startTransition(() => submitAction(formData))}
            className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50"
          >
            <input type="hidden" name="serviceId" value={service.id} />
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{service.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{service.description}</p>
              </div>
              <div className="mt-3 sm:mt-0">
                {service.isSet && editingServiceId !== service.id && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  >
                    <Shield className="mr-1.5 h-3.5 w-3.5" /> Encrypted & Set
                  </Badge>
                )}
                {!service.isSet && editingServiceId !== service.id && <Badge variant="outline">Not Set</Badge>}
              </div>
            </div>

            {editingServiceId === service.id ? (
              <div className="mt-4 space-y-3">
                <Label htmlFor={`${service.id}-key`} className="sr-only">
                  {service.name}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`${service.id}-key`}
                    name="keyValue"
                    type={showKeyValue ? "text" : "password"}
                    value={currentKeyValue}
                    onChange={(e) => setCurrentKeyValue(e.target.value)}
                    placeholder={service.placeholder}
                    className="flex-grow"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowKeyValue(!showKeyValue)}
                    aria-label={showKeyValue ? "Hide key" : "Show key"}
                  >
                    {showKeyValue ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    name="actionType"
                    value="save"
                    disabled={isActionPending || !currentKeyValue.trim()}
                    className="bg-[#007AFF] hover:bg-[#0056b3] text-white"
                  >
                    {isActionPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Encrypted Key
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isActionPending}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex gap-2">
                <Button type="button" variant="outline" onClick={() => handleEdit(service)} disabled={isActionPending}>
                  {service.isSet ? "Update Key" : "Add Key"}
                </Button>
                {service.isSet && (
                  <Button
                    type="submit"
                    name="actionType"
                    value="remove"
                    variant="destructive"
                    size="sm"
                    disabled={isActionPending}
                  >
                    {isActionPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Remove
                  </Button>
                )}
              </div>
            )}
          </form>
        ))}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          <Shield className="inline h-3 w-3 mr-1" />
          All API keys are encrypted with AES-256-GCM encryption and stored securely. Integrations allow your agents to
          connect to external services and perform a wider range of tasks.
        </p>
      </CardFooter>
    </Card>
  )
}
