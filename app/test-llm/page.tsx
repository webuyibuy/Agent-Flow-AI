"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Zap } from "lucide-react"
import { testLLMProvider, generateTextWithLLM } from "./actions"

const PROVIDERS = [
  { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"] },
  {
    id: "anthropic",
    name: "Anthropic",
    models: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
  },
  { id: "groq", name: "Groq", models: ["llama3-70b-8192", "llama3-8b-8192", "mixtral-8x7b-32768"] },
  { id: "xai", name: "xAI", models: ["grok-beta"] },
]

export default function TestLLMPage() {
  const [selectedProvider, setSelectedProvider] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [prompt, setPrompt] = useState("Write a short poem about AI agents helping humans.")
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [generationResult, setGenerationResult] = useState<any>(null)

  const handleTestConnection = async () => {
    if (!selectedProvider) return

    setIsTestingConnection(true)
    setTestResult(null)

    try {
      const result = await testLLMProvider(selectedProvider)
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleGenerateText = async () => {
    if (!selectedProvider || !prompt.trim()) return

    setIsGenerating(true)
    setGenerationResult(null)

    try {
      const result = await generateTextWithLLM(prompt, {
        provider: selectedProvider,
        model: selectedModel || undefined,
        temperature: 0.7,
        maxTokens: 500,
      })
      setGenerationResult(result)
    } catch (error) {
      setGenerationResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedProviderData = PROVIDERS.find((p) => p.id === selectedProvider)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Zap className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold">LLM Provider Testing</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Configuration</CardTitle>
            <CardDescription>Test your configured LLM providers and generate text</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProviderData && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Model (Optional)</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Use default model" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProviderData.models.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Test Prompt</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your test prompt..."
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleTestConnection}
                disabled={!selectedProvider || isTestingConnection}
                variant="outline"
                className="flex-1"
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>

              <Button
                onClick={handleGenerateText}
                disabled={!selectedProvider || !prompt.trim() || isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Text"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Connection status and generated responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connection Test Result */}
            {testResult && (
              <div className="space-y-2">
                <h3 className="font-medium">Connection Test</h3>
                <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                      {testResult.success ? (
                        <div className="space-y-1">
                          <div>✅ Connection successful!</div>
                          {testResult.latency && <div>⚡ Latency: {testResult.latency}ms</div>}
                          {testResult.model && <div>🤖 Model: {testResult.model}</div>}
                        </div>
                      ) : (
                        <div>❌ {testResult.error}</div>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              </div>
            )}

            {/* Generation Result */}
            {generationResult && (
              <div className="space-y-2">
                <h3 className="font-medium">Generated Response</h3>
                {generationResult.success ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-sm whitespace-pre-wrap">{generationResult.content}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {generationResult.provider && (
                        <Badge variant="secondary">Provider: {generationResult.provider}</Badge>
                      )}
                      {generationResult.model && <Badge variant="secondary">Model: {generationResult.model}</Badge>}
                      {generationResult.usage && (
                        <Badge variant="secondary">Tokens: {generationResult.usage.totalTokens}</Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>❌ {generationResult.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {!testResult && !generationResult && (
              <div className="text-center text-muted-foreground py-8">
                <Zap className="mx-auto h-12 w-12 opacity-50 mb-4" />
                <p>Select a provider and run tests to see results here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
