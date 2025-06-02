"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Send, ArrowRight, Sparkles } from "lucide-react"
import { generateChatResponse, completeAgentSetup } from "@/app/onboarding/agent-config/chat-actions"
import type { AgentTemplate } from "@/lib/agent-templates"

interface Message {
  id: string
  role: "assistant" | "user"
  content: string
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

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const startConversation = async () => {
    setIsLoading(true)
    try {
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
          },
        ])

        if (response.agentData) {
          setAgentData((prev) => ({
            ...prev,
            ...response.agentData,
          }))
        }

        if (response.conversationCount !== undefined) {
          setConversationCount(response.conversationCount)
        }
      }
    } catch (error) {
      console.error("Error starting conversation:", error)
      setMessages([
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Hi! I'm your ${templateName}. How can I help you today?`,
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

    // Add user message to chat
    const newUserMessage = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: userMessage,
    }

    setMessages((prev) => [...prev, newUserMessage])
    setIsLoading(true)

    // Focus back on input after sending
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)

    try {
      // Convert messages to the format expected by the API
      const messageHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Add the new user message
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
        // Add AI response to chat
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: response.message,
          },
        ])

        // Update agent data
        if (response.agentData) {
          setAgentData((prev) => ({
            ...prev,
            ...response.agentData,
          }))
        }

        // Update conversation count
        if (response.conversationCount !== undefined) {
          setConversationCount(response.conversationCount)
        }

        // Check if setup is complete (show button after 5 exchanges)
        if (response.setupComplete) {
          setSetupComplete(true)
        }
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "I'm having trouble processing that. Could you try rephrasing?",
        },
      ])
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
      console.log("Creating agent with data:", agentData)

      const result = await completeAgentSetup({
        agentData,
        userId,
      })

      if (result.success && result.redirectUrl) {
        console.log("Agent created successfully, redirecting to:", result.redirectUrl)
        router.push(result.redirectUrl)
      } else {
        console.error("Agent creation failed:", result.error)
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: result.error || "There was an issue creating your agent. Please try again.",
          },
        ])
      }
    } catch (error) {
      console.error("Error creating agent:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "There was an error creating your agent. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Get avatar image based on template
  const getAvatarImage = () => {
    if (template?.icon) {
      return `/placeholder.svg?height=48&width=48&query=${encodeURIComponent(templateName + " icon")}`
    }
    return `/placeholder.svg?height=48&width=48&query=${encodeURIComponent(templateName)}`
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <img
          src={getAvatarImage() || "/placeholder.svg"}
          alt={templateName}
          className="w-12 h-12 rounded-full border-2 border-gray-200"
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{templateName} Setup</h1>
          <p className="text-gray-600 dark:text-gray-400">Let's chat to set up your agent</p>
        </div>
      </div>

      {/* Progress indicator */}
      {conversationCount > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Conversation progress: {conversationCount}/5</span>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full ${step <= conversationCount ? "bg-blue-600" : "bg-gray-300"}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Chat container */}
      <Card className="flex-1 min-h-[500px] max-h-[600px] flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 pt-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === "assistant"
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    : "bg-blue-600 text-white"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-100 dark:bg-gray-800">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-gray-500 text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Chat input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message and press Enter..."
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

      {/* Create Agent Button - Shows after 5 exchanges */}
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
