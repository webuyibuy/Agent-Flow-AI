import type React from "react"
import { BarChart2, Briefcase, Code, Users, MessageSquare, FileText, Zap, Settings } from "lucide-react"

export interface AgentTemplate {
  id: string
  name: string
  description: string
  icon: React.ElementType
  category: "business" | "technical" | "creative" | "support"
  defaultGoal: string
  defaultBehavior: string
  suggestedTools: string[]
  estimatedSetupTime: string
  difficulty: "beginner" | "intermediate" | "advanced"
  tags: string[]
  sampleTasks: string[]
  integrations: string[]
}

export const agentTemplates: AgentTemplate[] = [
  {
    id: "sales-lead-generator",
    name: "Sales Lead Generator",
    description: "Automate lead generation, qualification, and initial outreach to potential customers.",
    icon: BarChart2,
    category: "business",
    defaultGoal: "Generate 20 qualified leads per week through automated prospecting and initial outreach.",
    defaultBehavior:
      "Proactively research and identify potential customers based on defined criteria. Reach out via LinkedIn and email with personalized messages. Qualify leads based on budget, authority, need, and timeline. Schedule demos for qualified prospects and maintain detailed records in CRM.",
    suggestedTools: ["LinkedIn Sales Navigator", "Email automation", "CRM integration"],
    estimatedSetupTime: "15-30 minutes",
    difficulty: "intermediate",
    tags: ["sales", "lead generation", "outreach", "automation"],
    sampleTasks: [
      "Research 50 potential customers in the SaaS industry",
      "Send personalized LinkedIn connection requests to prospects",
      "Follow up with email sequences for interested leads",
      "Qualify leads and schedule demos for sales team",
    ],
    integrations: ["n8n", "lyzr"],
  },
  {
    id: "marketing-content-manager",
    name: "Marketing Content Manager",
    description: "Create, schedule, and optimize marketing content across multiple channels.",
    icon: Briefcase,
    category: "business",
    defaultGoal:
      "Increase social media engagement by 25% through consistent, high-quality content creation and posting.",
    defaultBehavior:
      "Create engaging content for social media platforms, blog posts, and email campaigns. Monitor trending topics and industry news to create timely content. Schedule posts for optimal engagement times. Analyze performance metrics and adjust content strategy accordingly.",
    suggestedTools: ["Social media scheduling", "Content creation", "Analytics tracking"],
    estimatedSetupTime: "20-40 minutes",
    difficulty: "intermediate",
    tags: ["marketing", "content", "social media", "analytics"],
    sampleTasks: [
      "Create 10 social media posts for the week",
      "Write a blog post about industry trends",
      "Design email newsletter template",
      "Analyze last month's content performance",
    ],
    integrations: ["n8n", "lyzr"],
  },
  {
    id: "developer-assistant",
    name: "Developer Assistant",
    description: "Automate development workflows, code reviews, and deployment processes.",
    icon: Code,
    category: "technical",
    defaultGoal: "Streamline development workflow by automating code reviews, testing, and deployment processes.",
    defaultBehavior:
      "Monitor code repositories for new commits and pull requests. Run automated tests and code quality checks. Deploy applications to staging and production environments. Generate documentation and notify team members of important changes. Maintain CI/CD pipelines and troubleshoot deployment issues.",
    suggestedTools: ["GitHub/GitLab integration", "CI/CD pipelines", "Code analysis"],
    estimatedSetupTime: "30-60 minutes",
    difficulty: "advanced",
    tags: ["development", "automation", "ci/cd", "code review"],
    sampleTasks: [
      "Set up automated testing pipeline",
      "Review and merge pull requests",
      "Deploy application to staging environment",
      "Generate API documentation",
    ],
    integrations: ["n8n"],
  },
  {
    id: "hr-recruitment-specialist",
    name: "HR Recruitment Specialist",
    description: "Streamline recruitment process from job posting to candidate onboarding.",
    icon: Users,
    category: "business",
    defaultGoal: "Reduce time-to-hire by 40% while maintaining high-quality candidate standards.",
    defaultBehavior:
      "Post job openings across multiple platforms. Screen resumes and applications based on predefined criteria. Conduct initial candidate screenings via automated questionnaires. Schedule interviews with qualified candidates. Send follow-up communications and manage the interview process. Assist with onboarding new hires.",
    suggestedTools: ["ATS integration", "Interview scheduling", "Background checks"],
    estimatedSetupTime: "25-45 minutes",
    difficulty: "intermediate",
    tags: ["hr", "recruitment", "hiring", "onboarding"],
    sampleTasks: [
      "Post job opening to 5 job boards",
      "Screen 100 resumes for Software Engineer position",
      "Schedule interviews for top 10 candidates",
      "Send onboarding materials to new hire",
    ],
    integrations: ["n8n", "lyzr"],
  },
  {
    id: "customer-support-agent",
    name: "Customer Support Agent",
    description: "Provide 24/7 customer support with intelligent ticket routing and response automation.",
    icon: MessageSquare,
    category: "support",
    defaultGoal: "Achieve 90% customer satisfaction while reducing response time to under 2 hours.",
    defaultBehavior:
      "Monitor support channels for incoming tickets and messages. Categorize and prioritize tickets based on urgency and type. Provide automated responses for common questions using knowledge base. Escalate complex issues to human agents with context and suggested solutions. Follow up with customers to ensure satisfaction.",
    suggestedTools: ["Help desk integration", "Knowledge base", "Chat automation"],
    estimatedSetupTime: "20-35 minutes",
    difficulty: "beginner",
    tags: ["support", "customer service", "automation", "tickets"],
    sampleTasks: [
      "Respond to 50 common support questions",
      "Escalate complex technical issue to engineering team",
      "Update knowledge base with new FAQ",
      "Send customer satisfaction survey",
    ],
    integrations: ["n8n", "lyzr"],
  },
  {
    id: "research-analyst",
    name: "Research Analyst",
    description: "Conduct comprehensive market research and competitive analysis with automated reporting.",
    icon: FileText,
    category: "business",
    defaultGoal: "Deliver weekly market intelligence reports with actionable insights for strategic decision-making.",
    defaultBehavior:
      "Monitor industry news, competitor activities, and market trends. Collect and analyze data from multiple sources including news sites, social media, and industry reports. Generate comprehensive research reports with key findings and recommendations. Track competitor pricing, product launches, and marketing campaigns.",
    suggestedTools: ["Web scraping", "Data analysis", "Report generation"],
    estimatedSetupTime: "35-50 minutes",
    difficulty: "advanced",
    tags: ["research", "analysis", "market intelligence", "reporting"],
    sampleTasks: [
      "Monitor competitor pricing changes",
      "Analyze industry trend reports",
      "Generate weekly market summary",
      "Track competitor social media activity",
    ],
    integrations: ["n8n", "lyzr"],
  },
  {
    id: "productivity-optimizer",
    name: "Productivity Optimizer",
    description: "Optimize personal and team productivity through task automation and workflow management.",
    icon: Zap,
    category: "business",
    defaultGoal: "Increase team productivity by 30% through intelligent task management and workflow automation.",
    defaultBehavior:
      "Monitor team calendars and task management systems. Automatically schedule meetings and block focus time. Send reminders for deadlines and important tasks. Generate productivity reports and identify bottlenecks. Suggest workflow improvements and automate repetitive tasks.",
    suggestedTools: ["Calendar integration", "Task management", "Time tracking"],
    estimatedSetupTime: "15-25 minutes",
    difficulty: "beginner",
    tags: ["productivity", "automation", "scheduling", "optimization"],
    sampleTasks: [
      "Schedule team standup meetings for the week",
      "Send deadline reminders to team members",
      "Generate weekly productivity report",
      "Block focus time for deep work sessions",
    ],
    integrations: ["n8n"],
  },
  {
    id: "custom-agent",
    name: "Custom Agent",
    description: "Build a completely custom agent tailored to your specific needs and requirements.",
    icon: Settings,
    category: "technical",
    defaultGoal: "Define your own objective and customize the agent's behavior to match your unique requirements.",
    defaultBehavior:
      "Customize this agent's behavior, tools, and integrations to match your specific use case. Define custom workflows, set up unique triggers, and configure specialized responses for your particular industry or business needs.",
    suggestedTools: ["Custom integrations", "Flexible workflows", "Tailored responses"],
    estimatedSetupTime: "Variable",
    difficulty: "advanced",
    tags: ["custom", "flexible", "tailored", "advanced"],
    sampleTasks: [
      "Define custom workflow requirements",
      "Set up specialized integrations",
      "Configure unique response patterns",
      "Test and refine custom behaviors",
    ],
    integrations: ["n8n", "lyzr"],
  },
]

export function getTemplateById(id: string): AgentTemplate | undefined {
  return agentTemplates.find((template) => template.id === id)
}

export function getTemplatesByCategory(category: AgentTemplate["category"]): AgentTemplate[] {
  return agentTemplates.filter((template) => template.category === category)
}

export function getTemplatesByDifficulty(difficulty: AgentTemplate["difficulty"]): AgentTemplate[] {
  return agentTemplates.filter((template) => template.difficulty === difficulty)
}

export function searchTemplates(query: string): AgentTemplate[] {
  const lowercaseQuery = query.toLowerCase()
  return agentTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
  )
}

export const templateCategories = [
  { id: "business", name: "Business", description: "Sales, marketing, and business operations" },
  { id: "technical", name: "Technical", description: "Development, automation, and technical workflows" },
  { id: "creative", name: "Creative", description: "Content creation and creative workflows" },
  { id: "support", name: "Support", description: "Customer service and support automation" },
] as const

export const difficultyLevels = [
  { id: "beginner", name: "Beginner", description: "Easy to set up, minimal configuration required" },
  { id: "intermediate", name: "Intermediate", description: "Moderate setup, some technical knowledge helpful" },
  { id: "advanced", name: "Advanced", description: "Complex setup, technical expertise recommended" },
] as const
