"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, ArrowRight, Sparkles, AlertCircle, Settings, CheckCircle, Lightbulb } from "lucide-react"
import { generateChatResponse, completeAgentSetup, acceptSuggestion } from "@/app/onboarding/agent-config/chat-actions"
import type { AgentTemplate } from "@/lib/agent-templates"
import Link from "next/link"

interface Message {
  id: string
  role: "assistant" | "user"
  content: string
  suggestions?: string[]
  apiCallMade?: boolean
}

interface AgentChatSetupProps {
  templateSlug: string
  templateName: string
  userId: string
  template?: AgentTemplate | null
}

export default function AgentChatSetup({ templateSlug, templateName, userId, template }: AgentChatSetupProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [conversationCount, setConversationCount] = useState(0)
  const [apiError, setApiError] = useState<string | null>(null)
  const [apiCallsMade, setApiCallsMade] = useState(0)
  const [agentData, setAgentData] = useState<any>({
    templateSlug,
    templateName,
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Initialize conversation when component mounts
  useEffect(() => {
    if (messages.length === 0) {
      startConversation()
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input on mount and after loading
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isLoading])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const startConversation = async () => {
    setIsLoading(true)
    setApiError(null)

    try {
      console.log("🚀 Starting conversation...")
      const response = await generateChatResponse({
        templateSlug,
        templateName,
        userId,
        isInitial: true,
      })

      if (response.success && response.message) {
        setMessages([
          {
            id: `init-${Date.now()}`,
            role: "assistant",
            content: response.message,
            suggestions: response.suggestions,
            apiCallMade: response.apiCallMade,
          },
        ])

        if (response.apiCallMade) {
          setApiCallsMade((prev) => prev + 1)
        }

        if (response.agentData) {
          setAgentData((prev) => ({
            ...prev,
            ...response.agentData,
          }))
        }

        setConversationCount(0)
      } else {
        // Show error but don't block input
        setApiError(response.error || "Failed to start conversation")
        // Add fallback message so user can still interact
        setMessages([
          {
            id: `fallback-${Date.now()}`,
            role: "assistant",
            content: `Hello! I'm your ${templateName}. How can I help you set up your agent today?`,
          },
        ])
      }
    } catch (error) {
      console.error("Error starting conversation:", error)
      setApiError("Connection error. Please check your API key in settings.")
      // Add fallback message
      setMessages([
        {
          id: `fallback-${Date.now()}`,
          role: "assistant",
          content: `Hello! I'm your ${templateName}. How can I help you set up your agent today?`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setApiError(null)

    // Add user message immediately
    const newUserMessage = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: userMessage,
    }

    setMessages((prev) => [...prev, newUserMessage])
    setIsLoading(true)

    try {
      console.log(`🚀 Sending message: "${userMessage}"`)

      const messageHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      messageHistory.push({
        role: "user",
        content: userMessage,
      })

      const response = await generateChatResponse({
        templateSlug,
        templateName,
        userId,
        messageHistory,
        userMessage,
        currentAgentData: agentData,
      })

      if (response.success && response.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: response.message,
            suggestions: response.suggestions,
            apiCallMade: response.apiCallMade,
          },
        ])

        if (response.apiCallMade) {
          setApiCallsMade((prev) => prev + 1)
        }

        if (response.agentData) {
          setAgentData((prev) => ({
            ...prev,
            ...response.agentData,
          }))
        }

        if (response.conversationCount !== undefined) {
          setConversationCount(response.conversationCount)
        }

        if (response.setupComplete) {
          setSetupComplete(true)
        }
      } else {
        // Show error but add fallback response
        setApiError(response.error || "API error occurred")
        setMessages((prev) => [
          ...prev,
          {
            id: `fallback-${Date.now()}`,
            role: "assistant",
            content: "I understand. Let me help you with that. Could you provide more details about what you need?",
          },
        ])
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setApiError("Failed to send message")
      // Add fallback response
      setMessages((prev) => [
        ...prev,
        {
          id: `fallback-${Date.now()}`,
          role: "assistant",
          content: "I understand. Let me help you with that. Could you provide more details about what you need?",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptSuggestion = async (suggestion: string) => {
    setIsLoading(true)
    try {
      const response = await acceptSuggestion(suggestion, userId, agentData)

      if (response.success && response.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: `user-accept-${Date.now()}`,
            role: "user",
            content: `✅ I accept: "${suggestion}"`,
          },
          {
            id: `assistant-accept-${Date.now()}`,
            role: "assistant",
            content: response.message,
            apiCallMade: true,
          },
        ])

        setApiCallsMade((prev) => prev + 1)

        if (response.agentData) {
          setAgentData((prev) => ({
            ...prev,
            ...response.agentData,
          }))
        }
      }
    } catch (error) {
      console.error("Error accepting suggestion:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCreateAgent = async () => {
    setIsLoading(true)
    try {
      const result = await completeAgentSetup({
        agentData,
        userId,
      })

      if (result.success && result.redirectUrl) {
        router.push(result.redirectUrl)
      } else {
        setApiError(result.error || "Failed to create agent")
      }
    } catch (error) {
      console.error("Error creating agent:", error)
      setApiError("Failed to create agent. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src={`/placeholder.svg?height=48&width=48&query=${encodeURIComponent(templateName)}`}
            alt={templateName}
            className="w-12 h-12 rounded-full border-2 border-gray-200"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{templateName} Configuration</h1>
            <p className="text-gray-600 dark:text-gray-400">Configure your AI agent through conversation</p>
          </div>
        </div>

        {/* API Status */}
        <div className="flex items-center space-x-2">
          <Badge variant={apiCallsMade > 0 ? "default" : "secondary"} className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            {apiCallsMade} API calls
          </Badge>
        </div>
      </div>

      {/* API Error Alert - Non-blocking */}
      {apiError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{apiError}</span>
            {apiError.includes("API key") && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/settings/profile">
                  <Settings className="h-4 w-4 mr-2" />
                  Add API Key
                </Link>
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Progress */}
      {conversationCount > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Configuration progress: {conversationCount}/5 exchanges</span>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full ${step <= conversationCount ? "bg-green-600" : "bg-gray-300"}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Chat Container - Clean and Professional */}
      <Card className="flex-1 min-h-[500px] max-h-[600px] flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 pt-6">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === "assistant"
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800"
                      : "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {message.apiCallMade && (
                    <div className="mt-2 text-xs opacity-70 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      OpenAI API response
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] space-y-2">
                    <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Recommended next steps:
                    </div>
                    <div className="space-y-1">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-left h-auto p-2 text-xs"
                          onClick={() => handleAcceptSuggestion(suggestion)}
                          disabled={isLoading}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-100 dark:bg-gray-800">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-gray-500 text-sm">Processing your request...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Professional Input - ALWAYS ENABLED */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Agent Configuration Preview */}
      {Object.keys(agentData).length > 2 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-2">Agent Configuration</h3>
            <div className="text-xs space-y-1 text-gray-600">
              {agentData.name && (
                <div>
                  <strong>Name:</strong> {agentData.name}
                </div>
              )}
              {agentData.goal && (
                <div>
                  <strong>Goal:</strong> {agentData.goal}
                </div>
              )}
              {agentData.behavior && (
                <div>
                  <strong>Behavior:</strong> {agentData.behavior}
                </div>
              )}
              {agentData.focus_area && (
                <div>
                  <strong>Focus Area:</strong> {agentData.focus_area}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Agent Button */}
      {setupComplete && (
        <Button
          onClick={handleCreateAgent}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Agent...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Create Agent <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      )}
    </div>
  )
}
