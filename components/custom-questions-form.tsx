"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Brain, AlertTriangle, CheckCircle, Sparkles, RefreshCw } from "lucide-react"
import { generateAgentQuestions } from "@/app/onboarding/agent-config/custom-questions-actions"

interface CustomQuestion {
  id: string
  question: string
  type: "text" | "textarea" | "select" | "multiselect"
  options?: string[]
  required: boolean
  category: string
  placeholder?: string
}

interface CustomQuestionsFormProps {
  templateSlug: string
  templateName: string
  agentGoal: string
  onAnswersChange: (answers: Record<string, any>) => void
  initialAnswers?: Record<string, any>
}

export default function CustomQuestionsForm({
  templateSlug,
  templateName,
  agentGoal,
  onAnswersChange,
  initialAnswers = {},
}: CustomQuestionsFormProps) {
  const [questions, setQuestions] = useState<CustomQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [skipAI, setSkipAI] = useState(false)

  const loadFallbackQuestions = () => {
    console.log("🔄 Loading fallback questions for template:", templateSlug)

    const fallbackQuestions = getFallbackQuestionsForTemplate(templateSlug, templateName)
    setQuestions(fallbackQuestions)
    setUsedFallback(true)
    setError(null)

    console.log("✅ Fallback questions loaded:", fallbackQuestions.length, "questions")
  }

  const loadQuestions = async (forceAI = false) => {
    if (!agentGoal.trim()) {
      setQuestions([])
      setIsLoading(false)
      return
    }

    // If we've decided to skip AI or if goal is too short, use fallback immediately
    if (skipAI || (!forceAI && agentGoal.length < 20)) {
      loadFallbackQuestions()
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("🤖 Attempting to generate AI questions for:", { templateSlug, agentGoal, templateName })

      const result = await generateAgentQuestions(templateSlug, agentGoal, templateName)

      if (result.success && result.questions && result.questions.length > 0) {
        setQuestions(result.questions)
        setUsedFallback(result.usedFallback || false)
        setSkipAI(false)

        if (result.error && result.usedFallback) {
          setError(result.error)
        }

        console.log("✅ Questions loaded successfully:", result.questions.length, "questions")
      } else {
        console.warn("⚠️ AI generation failed, using fallback:", result.error)

        // If it's an API quota error, skip AI for this session
        if (result.error?.includes("quota") || result.error?.includes("billing")) {
          setSkipAI(true)
        }

        loadFallbackQuestions()
        setError(result.error)
      }
    } catch (err) {
      console.error("❌ Error loading questions:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      loadFallbackQuestions()
    } finally {
      setIsLoading(false)
      setIsRegenerating(false)
    }
  }

  useEffect(() => {
    if (agentGoal.trim()) {
      loadQuestions()
    } else {
      setQuestions([])
    }
  }, [templateSlug, agentGoal])

  useEffect(() => {
    onAnswersChange(answers)
  }, [answers, onAnswersChange])

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleRegenerateQuestions = async () => {
    setIsRegenerating(true)
    setSkipAI(false) // Allow AI retry
    await loadQuestions(true) // Force AI attempt
  }

  const handleUseFallback = () => {
    setSkipAI(true)
    loadFallbackQuestions()
  }

  const renderQuestion = (question: CustomQuestion) => {
    const value = answers[question.id] || ""

    switch (question.type) {
      case "textarea":
        return (
          <Textarea
            id={question.id}
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            className="min-h-[100px] bg-white/50 backdrop-blur-sm border-gray-200/50 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200"
            required={question.required}
          />
        )

      case "select":
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleAnswerChange(question.id, newValue)}
            required={question.required}
          >
            <SelectTrigger className="bg-white/50 backdrop-blur-sm border-gray-200/50 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200">
              <SelectValue placeholder={question.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-md border-gray-200/50">
              {question.options?.map((option) => (
                <SelectItem key={option} value={option} className="hover:bg-blue-50/50">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "multiselect":
        return (
          <div className="space-y-3 p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-gray-200/50">
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-3">
                <Checkbox
                  id={`${question.id}-${option}`}
                  checked={Array.isArray(value) && value.includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? value : []
                    if (checked) {
                      handleAnswerChange(question.id, [...currentValues, option])
                    } else {
                      handleAnswerChange(
                        question.id,
                        currentValues.filter((v) => v !== option),
                      )
                    }
                  }}
                  className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor={`${question.id}-${option}`} className="text-sm font-medium text-gray-700">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )

      default: // text
        return (
          <Input
            id={question.id}
            type="text"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            className="bg-white/50 backdrop-blur-sm border-gray-200/50 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200"
            required={question.required}
          />
        )
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "strategy":
        return "🎯"
      case "configuration":
        return "⚙️"
      case "integration":
        return "🔗"
      case "metrics":
        return "📊"
      default:
        return "❓"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "strategy":
        return "bg-blue-100/80 text-blue-800 border-blue-200/50"
      case "configuration":
        return "bg-green-100/80 text-green-800 border-green-200/50"
      case "integration":
        return "bg-purple-100/80 text-purple-800 border-purple-200/50"
      case "metrics":
        return "bg-orange-100/80 text-orange-800 border-orange-200/50"
      default:
        return "bg-gray-100/80 text-gray-800 border-gray-200/50"
    }
  }

  if (!agentGoal.trim()) {
    return (
      <Card className="bg-white/70 backdrop-blur-md border-gray-200/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100/80 rounded-xl">
              <Brain className="h-5 w-5 text-blue-600" />
            </div>
            Configuration Questions
          </CardTitle>
          <CardDescription className="text-gray-600">
            Define your agent's primary goal above, and we'll suggest relevant configuration questions here.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="bg-white/70 backdrop-blur-md border-gray-200/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100/80 rounded-xl">
              <Brain className="h-5 w-5 text-blue-600" />
            </div>
            Configuration Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 bg-blue-100/80 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
              <div className="absolute inset-0 w-16 h-16 bg-blue-500/20 rounded-full animate-ping mx-auto"></div>
            </div>
            <p className="text-sm text-gray-600 font-medium">Generating questions for your {templateName}...</p>
            <p className="text-xs text-gray-500 mt-1">This may take a few moments</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUseFallback}
              className="mt-4 bg-white/50 backdrop-blur-sm border-gray-200/50 hover:bg-white/80"
            >
              Use Standard Questions Instead
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/70 backdrop-blur-md border-gray-200/50 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100/80 rounded-xl">
                <Brain className="h-5 w-5 text-blue-600" />
              </div>
              Configuration Questions
              {usedFallback && (
                <Badge variant="outline" className="ml-2 bg-blue-100/80 text-blue-800 border-blue-200/50">
                  Standard Questions
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              These questions will help configure your {templateName} for optimal performance.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {!skipAI && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateQuestions}
                disabled={isRegenerating}
                className="flex items-center gap-2 bg-white/50 backdrop-blur-sm border-gray-200/50 hover:bg-white/80 transition-all duration-200"
              >
                {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isRegenerating ? "Generating..." : "Try AI Again"}
              </Button>
            )}
            {!usedFallback && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseFallback}
                className="flex items-center gap-2 bg-white/50 backdrop-blur-sm border-gray-200/50 hover:bg-white/80 transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                Use Standard
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert className="bg-yellow-50/80 border-yellow-200/50 backdrop-blur-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">
              {error.includes("quota") || error.includes("billing") ? "API Quota Exceeded" : "AI Generation Issue"}
            </AlertTitle>
            <AlertDescription className="text-yellow-700">
              {error.includes("quota") || error.includes("billing") ? (
                <>
                  Your OpenAI API quota has been exceeded. Using standard questions instead. You can{" "}
                  <a href="/dashboard/settings/profile" className="underline font-medium">
                    check your API settings
                  </a>{" "}
                  or continue with the standard questions below.
                </>
              ) : error.includes("API key") ? (
                <>
                  OpenAI API key not configured. Please add your OpenAI API key in{" "}
                  <a href="/dashboard/settings/profile" className="underline font-medium">
                    Settings → Profile → API Keys
                  </a>{" "}
                  to enable AI-generated questions.
                </>
              ) : (
                `AI generation issue: ${error}. Using standard questions instead.`
              )}
            </AlertDescription>
          </Alert>
        )}

        {!usedFallback && questions.length > 0 && (
          <Alert className="bg-green-50/80 border-green-200/50 backdrop-blur-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">AI-Generated Questions</AlertTitle>
            <AlertDescription className="text-green-700">
              These questions were generated specifically for your {templateName} based on your goal.
            </AlertDescription>
          </Alert>
        )}

        {usedFallback && questions.length > 0 && (
          <Alert className="bg-blue-50/80 border-blue-200/50 backdrop-blur-sm">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Standard Questions</AlertTitle>
            <AlertDescription className="text-blue-700">
              These are carefully crafted questions for {templateName} agents that will help you get started quickly.
            </AlertDescription>
          </Alert>
        )}

        {questions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100/80 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-2">No questions available</p>
            <p className="text-sm text-gray-500 mb-4">There was an issue loading configuration questions.</p>
            <Button onClick={() => loadFallbackQuestions()} variant="outline">
              Load Standard Questions
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {questions.map((question, index) => (
              <div key={question.id} className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge
                    variant="secondary"
                    className={`${getCategoryColor(question.category)} flex items-center gap-1 backdrop-blur-sm`}
                  >
                    <span>{getCategoryIcon(question.category)}</span>
                    {question.category}
                  </Badge>
                  {question.required && (
                    <Badge variant="destructive" className="text-xs bg-red-100/80 text-red-800 border-red-200/50">
                      Required
                    </Badge>
                  )}
                </div>

                <Label htmlFor={question.id} className="text-base font-semibold text-gray-800 leading-relaxed">
                  {index + 1}. {question.question}
                </Label>

                {renderQuestion(question)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Enhanced fallback questions function
function getFallbackQuestionsForTemplate(templateSlug: string, templateName: string): CustomQuestion[] {
  const fallbackQuestions: Record<string, CustomQuestion[]> = {
    "sales-lead-generator": [
      {
        id: "target_market",
        question: "What is your primary target market or ideal customer profile?",
        type: "textarea",
        required: true,
        category: "strategy",
        placeholder: "e.g., B2B SaaS companies with 50-200 employees in North America",
      },
      {
        id: "lead_sources",
        question: "Which lead sources should the agent prioritize?",
        type: "multiselect",
        options: [
          "LinkedIn",
          "Email campaigns",
          "Cold calling",
          "Referrals",
          "Content marketing",
          "Trade shows",
          "Social media",
          "Webinars",
        ],
        required: true,
        category: "configuration",
      },
      {
        id: "qualification_criteria",
        question: "What criteria should be used to qualify leads?",
        type: "textarea",
        required: true,
        category: "strategy",
        placeholder: "e.g., Budget > $10k, Decision maker identified, Timeline < 6 months",
      },
      {
        id: "outreach_tone",
        question: "What tone should the agent use in outreach?",
        type: "select",
        options: ["Professional", "Casual", "Friendly", "Direct", "Consultative"],
        required: true,
        category: "configuration",
      },
      {
        id: "success_metrics",
        question: "How will you measure the success of lead generation?",
        type: "multiselect",
        options: [
          "Number of qualified leads",
          "Conversion rate",
          "Response rate",
          "Meeting bookings",
          "Pipeline value",
        ],
        required: false,
        category: "metrics",
      },
    ],
    "marketing-content-manager": [
      {
        id: "brand_voice",
        question: "How would you describe your brand voice and tone?",
        type: "select",
        options: ["Professional", "Casual", "Friendly", "Authoritative", "Playful", "Technical", "Inspirational"],
        required: true,
        category: "strategy",
      },
      {
        id: "content_types",
        question: "What types of content should the agent create?",
        type: "multiselect",
        options: [
          "Blog posts",
          "Social media posts",
          "Email newsletters",
          "Video scripts",
          "Infographics",
          "Case studies",
          "White papers",
          "Product descriptions",
        ],
        required: true,
        category: "configuration",
      },
      {
        id: "target_audience",
        question: "Who is your primary target audience?",
        type: "textarea",
        required: true,
        category: "strategy",
        placeholder: "Describe your ideal audience demographics, interests, and pain points",
      },
      {
        id: "posting_frequency",
        question: "How often should content be created?",
        type: "select",
        options: ["Daily", "3-4 times per week", "Weekly", "Bi-weekly", "Monthly"],
        required: true,
        category: "configuration",
      },
      {
        id: "content_goals",
        question: "What are your primary content marketing goals?",
        type: "multiselect",
        options: [
          "Brand awareness",
          "Lead generation",
          "Customer education",
          "Thought leadership",
          "Community building",
          "Sales support",
        ],
        required: true,
        category: "strategy",
      },
    ],
    "developer-assistant": [
      {
        id: "tech_stack",
        question: "What is your primary technology stack?",
        type: "multiselect",
        options: ["React", "Vue.js", "Angular", "Node.js", "Python", "Java", "C#", ".NET", "PHP", "Ruby", "Go", "Rust"],
        required: true,
        category: "configuration",
      },
      {
        id: "development_focus",
        question: "What type of development assistance do you need most?",
        type: "multiselect",
        options: [
          "Code review",
          "Bug fixing",
          "Architecture planning",
          "Testing",
          "Documentation",
          "Performance optimization",
          "Security",
        ],
        required: true,
        category: "strategy",
      },
      {
        id: "project_type",
        question: "What type of projects do you typically work on?",
        type: "select",
        options: [
          "Web applications",
          "Mobile apps",
          "APIs",
          "Desktop applications",
          "DevOps/Infrastructure",
          "Data science",
          "Machine learning",
        ],
        required: true,
        category: "configuration",
      },
      {
        id: "team_size",
        question: "What is your team size?",
        type: "select",
        options: ["Solo developer", "2-5 developers", "6-15 developers", "16+ developers"],
        required: false,
        category: "configuration",
      },
      {
        id: "coding_standards",
        question: "What coding standards and practices should the agent follow?",
        type: "textarea",
        required: false,
        category: "configuration",
        placeholder: "e.g., ESLint rules, naming conventions, testing requirements",
      },
    ],
    "hr-recruitment-specialist": [
      {
        id: "hiring_focus",
        question: "What types of roles do you typically hire for?",
        type: "multiselect",
        options: [
          "Technical roles",
          "Sales roles",
          "Marketing roles",
          "Operations roles",
          "Executive roles",
          "Customer service",
          "Design roles",
        ],
        required: true,
        category: "strategy",
      },
      {
        id: "company_size",
        question: "What is your company size?",
        type: "select",
        options: ["Startup (1-50)", "Small (51-200)", "Medium (201-1000)", "Large (1000+)"],
        required: true,
        category: "configuration",
      },
      {
        id: "sourcing_channels",
        question: "Which sourcing channels should the agent prioritize?",
        type: "multiselect",
        options: [
          "LinkedIn",
          "Job boards",
          "Referrals",
          "University partnerships",
          "Recruitment agencies",
          "Social media",
          "Industry events",
        ],
        required: true,
        category: "configuration",
      },
      {
        id: "screening_criteria",
        question: "What are your key screening criteria?",
        type: "textarea",
        required: true,
        category: "strategy",
        placeholder: "e.g., Years of experience, specific skills, cultural fit indicators",
      },
      {
        id: "hiring_timeline",
        question: "What is your typical hiring timeline?",
        type: "select",
        options: ["1-2 weeks", "2-4 weeks", "1-2 months", "2-3 months", "3+ months"],
        required: false,
        category: "configuration",
      },
    ],
    "customer-support-agent": [
      {
        id: "support_channels",
        question: "Which support channels should the agent handle?",
        type: "multiselect",
        options: ["Email", "Live chat", "Phone", "Social media", "Help desk tickets", "Community forums"],
        required: true,
        category: "configuration",
      },
      {
        id: "response_tone",
        question: "What tone should the agent use with customers?",
        type: "select",
        options: ["Professional", "Friendly", "Empathetic", "Direct", "Casual"],
        required: true,
        category: "strategy",
      },
      {
        id: "issue_types",
        question: "What types of issues does the agent need to handle?",
        type: "multiselect",
        options: [
          "Technical problems",
          "Billing questions",
          "Product inquiries",
          "Account issues",
          "Feature requests",
          "Complaints",
        ],
        required: true,
        category: "configuration",
      },
      {
        id: "escalation_criteria",
        question: "When should issues be escalated to human agents?",
        type: "textarea",
        required: true,
        category: "strategy",
        placeholder: "e.g., Complex technical issues, billing disputes over $X, angry customers",
      },
      {
        id: "response_time_goals",
        question: "What are your response time goals?",
        type: "select",
        options: ["Immediate", "Within 1 hour", "Within 4 hours", "Within 24 hours", "Within 48 hours"],
        required: true,
        category: "metrics",
      },
    ],
    "research-analyst": [
      {
        id: "research_focus",
        question: "What type of research does the agent need to conduct?",
        type: "multiselect",
        options: [
          "Market research",
          "Competitive analysis",
          "Industry trends",
          "Customer insights",
          "Product research",
          "Academic research",
        ],
        required: true,
        category: "strategy",
      },
      {
        id: "data_sources",
        question: "Which data sources should the agent prioritize?",
        type: "multiselect",
        options: [
          "Industry reports",
          "Academic papers",
          "News articles",
          "Company websites",
          "Social media",
          "Government data",
          "Surveys",
        ],
        required: true,
        category: "configuration",
      },
      {
        id: "research_depth",
        question: "What level of research depth is typically required?",
        type: "select",
        options: ["Quick overview", "Moderate analysis", "Deep dive", "Comprehensive study"],
        required: true,
        category: "configuration",
      },
      {
        id: "output_format",
        question: "What format should research outputs take?",
        type: "multiselect",
        options: [
          "Executive summaries",
          "Detailed reports",
          "Data visualizations",
          "Presentations",
          "Spreadsheets",
          "Infographics",
        ],
        required: true,
        category: "configuration",
      },
      {
        id: "research_frequency",
        question: "How often is research typically needed?",
        type: "select",
        options: ["Daily", "Weekly", "Monthly", "Quarterly", "As needed"],
        required: false,
        category: "configuration",
      },
    ],
    "productivity-optimizer": [
      {
        id: "optimization_focus",
        question: "What areas should the agent focus on optimizing?",
        type: "multiselect",
        options: [
          "Task management",
          "Time tracking",
          "Workflow automation",
          "Meeting efficiency",
          "Email management",
          "Project planning",
        ],
        required: true,
        category: "strategy",
      },
      {
        id: "current_tools",
        question: "What productivity tools do you currently use?",
        type: "multiselect",
        options: [
          "Slack",
          "Microsoft Teams",
          "Asana",
          "Trello",
          "Notion",
          "Monday.com",
          "Jira",
          "Google Workspace",
          "Microsoft 365",
        ],
        required: false,
        category: "integration",
      },
      {
        id: "team_structure",
        question: "What is your team structure?",
        type: "select",
        options: ["Individual contributor", "Small team (2-10)", "Department (11-50)", "Large organization (50+)"],
        required: true,
        category: "configuration",
      },
      {
        id: "productivity_goals",
        question: "What are your main productivity goals?",
        type: "multiselect",
        options: [
          "Reduce time waste",
          "Improve focus",
          "Better collaboration",
          "Automate repetitive tasks",
          "Track progress",
          "Meet deadlines",
        ],
        required: true,
        category: "strategy",
      },
      {
        id: "measurement_metrics",
        question: "How do you measure productivity success?",
        type: "multiselect",
        options: [
          "Tasks completed",
          "Time saved",
          "Goal achievement",
          "Team satisfaction",
          "Quality metrics",
          "Revenue impact",
        ],
        required: false,
        category: "metrics",
      },
    ],
  }

  // Return template-specific questions or generic ones
  return (
    fallbackQuestions[templateSlug] || [
      {
        id: "primary_objective",
        question: "What is the primary objective you want this agent to achieve?",
        type: "textarea",
        required: true,
        category: "strategy",
        placeholder: "Describe the main goal and expected outcomes",
      },
      {
        id: "target_users",
        question: "Who will be the primary users of this agent?",
        type: "textarea",
        required: true,
        category: "strategy",
        placeholder: "Describe the target audience and their needs",
      },
      {
        id: "success_metrics",
        question: "How will you measure the success of this agent?",
        type: "textarea",
        required: false,
        category: "metrics",
        placeholder: "e.g., Number of tasks completed, user satisfaction, time saved",
      },
      {
        id: "integration_needs",
        question: "What tools or systems should this agent integrate with?",
        type: "textarea",
        required: false,
        category: "integration",
        placeholder: "e.g., CRM, email, project management tools",
      },
      {
        id: "constraints",
        question: "Are there any constraints or limitations to consider?",
        type: "textarea",
        required: false,
        category: "configuration",
        placeholder: "e.g., Budget limits, compliance requirements, technical constraints",
      },
    ]
  )
}
