"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Brain,
  MessageSquare,
  Send,
  Paperclip,
  Lightbulb,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  FileText,
  Zap,
  Users,
  DollarSign,
} from "lucide-react"
import type { AIConsultationMessage, GeneratedPlan, AgentTask } from "@/lib/systematic-flow-types"

interface ProfessionalAIConsultantProps {
  plan: GeneratedPlan
  onMessageSent: (message: string) => Promise<void>
  messages: AIConsultationMessage[]
  isLoading: boolean
  generatedTasks: AgentTask[]
  onQuickQuestion: (question: string) => void
}

const ProfessionalAIConsultant: React.FC<ProfessionalAIConsultantProps> = ({
  plan,
  onMessageSent,
  messages,
  isLoading,
  generatedTasks,
  onQuickQuestion,
}) => {
  const [input, setInput] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() && !uploadedFile) return

    let messageContent = input.trim()
    if (uploadedFile) {
      messageContent += `\n\n[Attached: ${uploadedFile.name}]`
    }

    await onMessageSent(messageContent)
    setInput("")
    setUploadedFile(null)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 1024 * 1024) {
        // 1MB limit
        alert("File size must be under 1MB")
        return
      }
      setUploadedFile(file)
    }
  }

  const strategicQuestions = [
    {
      icon: <AlertTriangle className="h-3 w-3" />,
      text: "What are the biggest risks in my current plan?",
      category: "Risk Analysis",
    },
    {
      icon: <TrendingUp className="h-3 w-3" />,
      text: "How can I optimize my timeline for faster ROI?",
      category: "Optimization",
    },
    {
      icon: <Users className="h-3 w-3" />,
      text: "What stakeholder concerns should I address first?",
      category: "Stakeholders",
    },
    {
      icon: <DollarSign className="h-3 w-3" />,
      text: "How can I improve the business case and ROI projection?",
      category: "Business Value",
    },
    {
      icon: <Target className="h-3 w-3" />,
      text: "What success metrics should I prioritize?",
      category: "Success Metrics",
    },
    {
      icon: <Zap className="h-3 w-3" />,
      text: "What should be my immediate next steps?",
      category: "Action Plan",
    },
  ]

  return (
    <Card className="border-2 border-blue-100 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              AI Strategy Consultant
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Live Intelligence
              </Badge>
            </div>
            <CardDescription className="mt-1">
              Get expert guidance to refine your strategy and identify optimization opportunities
            </CardDescription>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Chat Messages Area */}
        <div className="h-96 overflow-y-auto bg-gray-50 border-b">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Ready to Optimize Your Strategy</h3>
                <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                  I'll analyze your plan and ask strategic questions to help you achieve better business outcomes.
                </p>

                {/* Strategic Question Starters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
                  {strategicQuestions.slice(0, 4).map((q, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-left justify-start h-auto p-3 hover:bg-blue-50 hover:border-blue-200"
                      onClick={() => onQuickQuestion(q.text)}
                    >
                      <div className="flex items-start gap-2">
                        {q.icon}
                        <div>
                          <div className="text-xs font-medium text-blue-600">{q.category}</div>
                          <div className="text-xs text-gray-700">{q.text}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] ${
                        message.role === "user"
                          ? "bg-blue-600 text-white rounded-lg rounded-br-sm"
                          : "bg-white border border-gray-200 rounded-lg rounded-bl-sm shadow-sm"
                      } p-4`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {message.role === "assistant" && (
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                            <Brain className="h-3 w-3 text-purple-600" />
                          </div>
                        )}
                        <span className="text-xs font-medium opacity-75">
                          {message.role === "user" ? "You" : "AI Strategy Consultant"}
                        </span>
                        <span className="text-xs opacity-50">
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>

                      {message.relatedQuestions && message.role === "assistant" && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs opacity-75 font-medium">Strategic follow-ups:</p>
                          <div className="space-y-1">
                            {message.relatedQuestions.map((q, index) => (
                              <Button
                                key={index}
                                variant="ghost"
                                size="sm"
                                className="text-xs h-auto p-2 text-left justify-start w-full bg-gray-50 hover:bg-gray-100 text-gray-700"
                                onClick={() => onQuickQuestion(q)}
                              >
                                <Lightbulb className="h-3 w-3 mr-2 text-yellow-500" />
                                {q}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-3 text-gray-500 bg-white border border-gray-200 rounded-lg p-4 max-w-[85%]">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                      <Loader2 className="h-3 w-3 animate-spin text-purple-600" />
                    </div>
                    <span className="text-sm">AI is analyzing your strategy and preparing insights...</span>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Generated Tasks Display */}
        {generatedTasks.length > 0 && (
          <div className="p-4 bg-orange-50 border-b">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="font-medium text-sm text-gray-800">
                Tasks Generated from Consultation ({generatedTasks.length})
              </span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {generatedTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-xs bg-white rounded p-2 border">
                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span className="font-medium">{task.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white">
          <div className="space-y-3">
            {/* File Upload Display */}
            {uploadedFile && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    Attached: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)}KB)
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setUploadedFile(null)}>
                    Remove
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Input Row */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Textarea
                  placeholder="Ask about strategy, risks, optimization, stakeholders, or implementation details..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-[60px] pr-12 resize-none border-gray-300 focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={handleFileUpload}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute bottom-2 right-2 h-8 w-8 p-0 hover:bg-gray-100"
                  title="Upload supporting material (max 1MB)"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={handleSend}
                disabled={(!input.trim() && !uploadedFile) || isLoading}
                className="self-end bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {strategicQuestions.slice(4).map((q, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs hover:bg-blue-50 hover:border-blue-200"
                  onClick={() => onQuickQuestion(q.text)}
                >
                  {q.icon}
                  <span className="ml-1">{q.category}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProfessionalAIConsultant
