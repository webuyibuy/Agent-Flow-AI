"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, ArrowRight, Sparkles, CheckCircle, Plus, Brain } from "lucide-react"
import { generateChatResponse, completeAgentSetup } from "@/app/onboarding/agent-config/chat-actions"
import type { AgentTemplate } from "@/lib/agent-templates"

interface Message {
  id: string
  role: "assistant" | "user"
  content: string
}

interface SuggestedTask {
  title: string
  description: string
  priority: "high" | "medium" | "low"
  category: string
}

interface WorkResult {
  type: string
  title: string
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
  const [agentData, setAgentData] = useState<any>({
    templateSlug,
    templateName,
  })
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([])
  const [workResults, setWorkResults] = useState<WorkResult[]>([])
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

        // Update agent data with any initial values
        if (response.agentData) {
          setAgentData((prev) => ({
            ...prev,
            ...response.agentData,
          }))
        }

        // Handle suggested tasks
        if (response.suggestedTasks) {
          setSuggestedTasks(response.suggestedTasks)
        }
      }
    } catch (error) {
      console.error("Error starting conversation:", error)
      setMessages([
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: getDefaultGreeting(templateName),
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

        // Update agent data with any new information
        if (response.agentData) {
          setAgentData((prev) => ({
            ...prev,
            ...response.agentData,
          }))
        }

        // Handle suggested tasks
        if (response.suggestedTasks) {
          setSuggestedTasks(response.suggestedTasks)
        }

        // Handle work results
        if (response.workResults) {
          setWorkResults((prev) => [...prev, ...response.workResults])
        }

        // Check if setup is complete
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
          content: "I'm having trouble processing that. Could you try rephrasing or providing more details?",
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
      const result = await completeAgentSetup({
        agentData,
        userId,
      })

      if (result.success && result.redirectUrl) {
        router.push(result.redirectUrl)
      } else {
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

  const addTaskToDependencies = async (task: SuggestedTask) => {
    // This would integrate with your dependency system
    console.log("Adding task to dependencies:", task)
    // Remove from suggested tasks
    setSuggestedTasks((prev) => prev.filter((t) => t.title !== task.title))
  }

  // Get avatar image based on template
  const getAvatarImage = () => {
    if (template?.icon) {
      return `/placeholder.svg?height=48&width=48&query=${encodeURIComponent(templateName + " icon")}`
    }
    return `/placeholder.svg?height=48&width=48&query=${encodeURIComponent(templateName)}`
  }

  const getDefaultGreeting = (templateName: string) => {
    const greetings: Record<string, string> = {
      "Marketing Content Manager":
        "Hi! I'm your Marketing Content Manager, ready to work! What marketing challenge can I help you tackle today?",
      "Personal Fitness Trainer":
        "Hey there! I'm your Personal Fitness Trainer, ready to help you achieve your goals! What fitness challenge are you working on?",
      "Sales Lead Generator":
        "Hello! I'm your Sales Lead Generation specialist, ready to grow your business! What's your biggest sales challenge?",
      "Customer Support Agent":
        "Hi! I'm your Customer Support specialist, ready to deliver amazing experiences! What support challenge can I solve?",
    }

    return (
      greetings[templateName] ||
      `Hi! I'm your ${templateName}, ready to work with you! What can I help you accomplish today?`
    )
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat container */}
        <div className="lg:col-span-2">
          <Card className="min-h-[500px] max-h-[600px] flex flex-col">
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 pt-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === "assistant"
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-100 dark:bg-gray-800">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      <span className="text-gray-500 text-sm">Working on it...</span>
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
                  placeholder="Ask me anything or request specific work..."
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
        </div>

        {/* Sidebar with tasks and results */}
        <div className="space-y-4">
          {/* Work Results */}
          {workResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Work Completed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {workResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <h4 className="font-medium text-green-800 dark:text-green-200">{result.title}</h4>
                    <p className="text-sm text-green-600 dark:text-green-300 mt-1">{result.content}</p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {result.type}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Suggested Tasks */}
          {suggestedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-blue-600" />
                  Suggested Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestedTasks.map((task, index) => (
                  <div
                    key={index}
                    className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-800 dark:text-blue-200">{task.title}</h4>
                        <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">{task.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge
                            variant={
                              task.priority === "high"
                                ? "destructive"
                                : task.priority === "medium"
                                  ? "default"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {task.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.category}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addTaskToDependencies(task)}
                        className="ml-2 text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Create Agent Button */}
          {messages.length > 2 && (
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
      </div>
    </div>
  )
}
