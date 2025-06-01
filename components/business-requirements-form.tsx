"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Lightbulb,
  Loader2,
  ClipboardList,
  Target,
  BarChart3,
  Users,
  AlertTriangle,
  Clock,
  Building,
} from "lucide-react"
import type { SmartQuestion } from "@/lib/systematic-flow-types"

interface BusinessRequirementsFormProps {
  initialGoal: string
  onGoalChange: (goal: string) => void
  metrics: string[]
  onMetricsChange: (metrics: string[]) => void
  stakeholders: string[]
  onStakeholdersChange: (stakeholders: string[]) => void
  constraints: string[]
  onConstraintsChange: (constraints: string[]) => void
  questions: SmartQuestion[]
  onAnswerChange: (questionId: string, answer: string | string[] | boolean) => void
  onSubmit: () => void
  isLoading: boolean
  loadingQuestions: boolean
  onLoadMoreQuestions: () => void
  businessContext?: {
    industry?: string
    companySize?: string
    timeline?: string
  }
}

const commonMetrics = [
  "Cost reduction",
  "Time savings",
  "Revenue increase",
  "Customer satisfaction",
  "Process efficiency",
  "Error reduction",
  "Employee productivity",
  "Compliance improvement",
  "Market share growth",
  "Customer retention",
]

const commonStakeholders = [
  "Executive leadership",
  "Department managers",
  "End users/employees",
  "IT department",
  "Customers",
  "Partners/vendors",
  "Compliance/legal",
  "Finance department",
  "Sales team",
  "Customer service",
]

const commonConstraints = [
  "Budget limitations",
  "Tight timeline",
  "Technical expertise",
  "Legacy system integration",
  "Data privacy requirements",
  "Regulatory compliance",
  "Change management",
  "Resource availability",
  "Security requirements",
  "Scalability needs",
]

const industries = [
  "Technology",
  "Finance & Banking",
  "Healthcare",
  "Retail & E-commerce",
  "Manufacturing",
  "Education",
  "Government",
  "Professional Services",
  "Telecommunications",
  "Energy & Utilities",
  "Transportation & Logistics",
  "Media & Entertainment",
  "Real Estate",
  "Hospitality & Tourism",
  "Agriculture",
  "Non-profit",
  "Other",
]

const companySizes = [
  "Startup (1-10 employees)",
  "Small (11-50 employees)",
  "Medium (51-200 employees)",
  "Large (201-1000 employees)",
  "Enterprise (1000+ employees)",
]

const timelines = [
  "Urgent (within 2 weeks)",
  "Short-term (1-2 months)",
  "Medium-term (3-6 months)",
  "Long-term (6+ months)",
]

export default function BusinessRequirementsForm({
  initialGoal,
  onGoalChange,
  metrics,
  onMetricsChange,
  stakeholders,
  onStakeholdersChange,
  constraints,
  onConstraintsChange,
  questions,
  onAnswerChange,
  onSubmit,
  isLoading,
  loadingQuestions,
  onLoadMoreQuestions,
  businessContext,
}: BusinessRequirementsFormProps) {
  const [newMetric, setNewMetric] = useState("")
  const [newStakeholder, setNewStakeholder] = useState("")
  const [newConstraint, setNewConstraint] = useState("")
  const [industry, setIndustry] = useState(businessContext?.industry || "")
  const [companySize, setCompanySize] = useState(businessContext?.companySize || "")
  const [timeline, setTimeline] = useState(businessContext?.timeline || "")

  const addMetric = () => {
    if (newMetric.trim() && !metrics.includes(newMetric.trim())) {
      onMetricsChange([...metrics, newMetric.trim()])
      setNewMetric("")
    }
  }

  const removeMetric = (metric: string) => {
    onMetricsChange(metrics.filter((m) => m !== metric))
  }

  const addStakeholder = () => {
    if (newStakeholder.trim() && !stakeholders.includes(newStakeholder.trim())) {
      onStakeholdersChange([...stakeholders, newStakeholder.trim()])
      setNewStakeholder("")
    }
  }

  const removeStakeholder = (stakeholder: string) => {
    onStakeholdersChange(stakeholders.filter((s) => s !== stakeholder))
  }

  const addConstraint = () => {
    if (newConstraint.trim() && !constraints.includes(newConstraint.trim())) {
      onConstraintsChange([...constraints, newConstraint.trim()])
      setNewConstraint("")
    }
  }

  const removeConstraint = (constraint: string) => {
    onConstraintsChange(constraints.filter((c) => c !== constraint))
  }

  const toggleCommonMetric = (metric: string) => {
    if (metrics.includes(metric)) {
      removeMetric(metric)
    } else {
      onMetricsChange([...metrics, metric])
    }
  }

  const toggleCommonStakeholder = (stakeholder: string) => {
    if (stakeholders.includes(stakeholder)) {
      removeStakeholder(stakeholder)
    } else {
      onStakeholdersChange([...stakeholders, stakeholder])
    }
  }

  const toggleCommonConstraint = (constraint: string) => {
    if (constraints.includes(constraint)) {
      removeConstraint(constraint)
    } else {
      onConstraintsChange([...constraints, constraint])
    }
  }

  const renderQuestionInput = (question: SmartQuestion) => {
    switch (question.type) {
      case "text":
        return (
          <Textarea
            placeholder="Enter your answer..."
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            className="min-h-[100px]"
          />
        )
      case "select":
        return (
          <Select onValueChange={(value) => onAnswerChange(question.id, value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "multiselect":
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${option}`}
                  onCheckedChange={(checked) => {
                    const current = onAnswerChange(question.id, [option])
                  }}
                />
                <label htmlFor={`${question.id}-${option}`} className="text-xs">
                  {option}
                </label>
              </div>
            ))}
          </div>
        )
      default:
        return null
    }
  }

  const isFormValid = () => {
    return initialGoal.trim().length > 0 && metrics.length > 0
  }

  return (
    <div className="space-y-6">
      {/* Business Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-500" />
            Business Context
          </CardTitle>
          <CardDescription>Help us understand your business environment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Industry</label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry..." />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Size</label>
              <Select value={companySize} onValueChange={setCompanySize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company size..." />
                </SelectTrigger>
                <SelectContent>
                  {companySizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Implementation Timeline</label>
              <Select value={timeline} onValueChange={setTimeline}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline..." />
                </SelectTrigger>
                <SelectContent>
                  {timelines.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Business Goal
          </CardTitle>
          <CardDescription>Define the primary business objective for this AI agent</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g., Reduce customer service response time by 30% while maintaining quality scores"
            value={initialGoal}
            onChange={(e) => onGoalChange(e.target.value)}
            className="min-h-[100px]"
          />
          <p className="text-xs text-gray-500 mt-2">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            Be specific about the business problem you're solving and the measurable outcome you expect.
          </p>
        </CardContent>
      </Card>

      {/* Success Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-500" />
            Success Metrics
          </CardTitle>
          <CardDescription>How will you measure the business impact of this AI agent?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {metrics.map((metric) => (
              <Badge key={metric} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                {metric}
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" onClick={() => removeMetric(metric)}>
                  ×
                </Button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add custom metric..."
              value={newMetric}
              onChange={(e) => setNewMetric(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addMetric()
                }
              }}
            />
            <Button onClick={addMetric} variant="outline">
              Add
            </Button>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Common business metrics:</p>
            <div className="flex flex-wrap gap-2">
              {commonMetrics.map((metric) => (
                <Badge
                  key={metric}
                  variant={metrics.includes(metric) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCommonMetric(metric)}
                >
                  {metric}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stakeholders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            Key Stakeholders
          </CardTitle>
          <CardDescription>Who will be impacted by or involved with this AI agent?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {stakeholders.map((stakeholder) => (
              <Badge key={stakeholder} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                {stakeholder}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => removeStakeholder(stakeholder)}
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add stakeholder..."
              value={newStakeholder}
              onChange={(e) => setNewStakeholder(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addStakeholder()
                }
              }}
            />
            <Button onClick={addStakeholder} variant="outline">
              Add
            </Button>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Common stakeholders:</p>
            <div className="flex flex-wrap gap-2">
              {commonStakeholders.map((stakeholder) => (
                <Badge
                  key={stakeholder}
                  variant={stakeholders.includes(stakeholder) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCommonStakeholder(stakeholder)}
                >
                  {stakeholder}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Constraints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Implementation Constraints
          </CardTitle>
          <CardDescription>What limitations or requirements should we be aware of?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {constraints.map((constraint) => (
              <Badge key={constraint} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                {constraint}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => removeConstraint(constraint)}
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add constraint..."
              value={newConstraint}
              onChange={(e) => setNewConstraint(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addConstraint()
                }
              }}
            />
            <Button onClick={addConstraint} variant="outline">
              Add
            </Button>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Common constraints:</p>
            <div className="flex flex-wrap gap-2">
              {commonConstraints.map((constraint) => (
                <Badge
                  key={constraint}
                  variant={constraints.includes(constraint) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCommonConstraint(constraint)}
                >
                  {constraint}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Questions */}
      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Additional Business Questions
            </CardTitle>
            <CardDescription>These questions will help us optimize your business solution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingQuestions ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                <p className="mt-2 text-xs text-gray-500">Generating business-focused questions...</p>
              </div>
            ) : (
              <>
                {questions.map((question) => (
                  <div key={question.id} className="space-y-3 p-4 border rounded-lg shadow-xs bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{question.question}</h4>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {question.category}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${question.priority === "high" ? "border-red-500 text-red-600" : question.priority === "medium" ? "border-yellow-500 text-yellow-600" : "border-green-500 text-green-600"}`}
                          >
                            {question.priority} priority
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {renderQuestionInput(question)}
                  </div>
                ))}
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={onLoadMoreQuestions} disabled={loadingQuestions}>
                    {loadingQuestions ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Lightbulb className="mr-2 h-4 w-4" />
                    )}
                    More Questions
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={onSubmit}
          disabled={!isFormValid() || isLoading}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardList className="mr-2 h-4 w-4" />}
          Generate Business Strategy
        </Button>
      </div>
    </div>
  )
}
