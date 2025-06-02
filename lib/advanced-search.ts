export interface SearchFilters {
  query: string
  status: string[]
  dateRange: {
    from: Date | null
    to: Date | null
  }
  tags: string[]
  priority: string[]
  assignee: string[]
}

export interface SearchResult {
  id: string
  type: "agent" | "task" | "dependency"
  title: string
  description: string
  status: string
  created_at: string
  updated_at: string
  relevanceScore: number
  highlights: string[]
  metadata: Record<string, any>
}

export class AdvancedSearchService {
  static async search(filters: Partial<SearchFilters>, userId: string): Promise<SearchResult[]> {
    const results: SearchResult[] = []

    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      // Search agents
      if (!filters.query || filters.query.length === 0 || this.shouldSearchAgents(filters)) {
        const agentQuery = supabase.from("agents").select("*").eq("owner_id", userId)

        if (filters.query) {
          agentQuery.or(`name.ilike.%${filters.query}%,goal.ilike.%${filters.query}%`)
        }

        if (filters.status && filters.status.length > 0) {
          agentQuery.in("status", filters.status)
        }

        if (filters.dateRange?.from) {
          agentQuery.gte("created_at", filters.dateRange.from.toISOString())
        }

        if (filters.dateRange?.to) {
          agentQuery.lte("created_at", filters.dateRange.to.toISOString())
        }

        const { data: agents } = await agentQuery.order("updated_at", { ascending: false }).limit(20)

        if (agents) {
          results.push(
            ...agents.map((agent) => ({
              id: agent.id,
              type: "agent" as const,
              title: agent.name || "Unnamed Agent",
              description: agent.goal || "No goal specified",
              status: agent.status || "unknown",
              created_at: agent.created_at,
              updated_at: agent.updated_at,
              relevanceScore: this.calculateRelevance(filters.query || "", agent.name + " " + agent.goal),
              highlights: this.getHighlights(filters.query || "", [agent.name, agent.goal]),
              metadata: { template_slug: agent.template_slug },
            })),
          )
        }
      }

      // Search tasks
      if (!filters.query || filters.query.length === 0 || this.shouldSearchTasks(filters)) {
        const taskQuery = supabase
          .from("tasks")
          .select(`
            *,
            agents!inner(id, name, owner_id)
          `)
          .eq("agents.owner_id", userId)

        if (filters.query) {
          taskQuery.or(`title.ilike.%${filters.query}%,metadata->>'user_notes'.ilike.%${filters.query}%`)
        }

        if (filters.status && filters.status.length > 0) {
          taskQuery.in("status", filters.status)
        }

        if (filters.dateRange?.from) {
          taskQuery.gte("created_at", filters.dateRange.from.toISOString())
        }

        if (filters.dateRange?.to) {
          taskQuery.lte("created_at", filters.dateRange.to.toISOString())
        }

        const { data: tasks } = await taskQuery.order("updated_at", { ascending: false }).limit(20)

        if (tasks) {
          results.push(
            ...tasks.map((task) => ({
              id: task.id,
              type: task.is_dependency ? ("dependency" as const) : ("task" as const),
              title: task.title || "Untitled Task",
              description: task.metadata?.user_notes || "No description",
              status: task.status || "unknown",
              created_at: task.created_at,
              updated_at: task.updated_at,
              relevanceScore: this.calculateRelevance(
                filters.query || "",
                task.title + " " + (task.metadata?.user_notes || ""),
              ),
              highlights: this.getHighlights(filters.query || "", [task.title, task.metadata?.user_notes]),
              metadata: { agent_name: task.agents?.name, is_dependency: task.is_dependency },
            })),
          )
        }
      }

      // Sort by relevance and recency
      return results
        .sort((a, b) => {
          const relevanceDiff = b.relevanceScore - a.relevanceScore
          if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        })
        .slice(0, 50)
    } catch (error) {
      console.error("Search error:", error)
      return []
    }
  }

  private static shouldSearchAgents(filters: Partial<SearchFilters>): boolean {
    return !filters.query || ["agent", "goal", "create"].some((term) => filters.query!.toLowerCase().includes(term))
  }

  private static shouldSearchTasks(filters: Partial<SearchFilters>): boolean {
    return (
      !filters.query ||
      ["task", "todo", "dependency", "work"].some((term) => filters.query!.toLowerCase().includes(term))
    )
  }

  private static calculateRelevance(query: string, text: string): number {
    if (!query || !text) return 0

    const queryLower = query.toLowerCase()
    const textLower = text.toLowerCase()

    // Exact match gets highest score
    if (textLower.includes(queryLower)) {
      const position = textLower.indexOf(queryLower)
      return 1.0 - (position / text.length) * 0.3
    }

    // Word matches
    const queryWords = queryLower.split(/\s+/)
    const textWords = textLower.split(/\s+/)
    const matches = queryWords.filter((qw) => textWords.some((tw) => tw.includes(qw)))

    return (matches.length / queryWords.length) * 0.7
  }

  private static getHighlights(query: string, texts: (string | null | undefined)[]): string[] {
    if (!query) return []

    const highlights: string[] = []
    const queryLower = query.toLowerCase()

    texts.forEach((text) => {
      if (!text) return

      const textLower = text.toLowerCase()
      const index = textLower.indexOf(queryLower)

      if (index !== -1) {
        const start = Math.max(0, index - 20)
        const end = Math.min(text.length, index + query.length + 20)
        const highlight = text.substring(start, end)
        highlights.push(highlight)
      }
    })

    return highlights.slice(0, 3)
  }

  static getAvailableFilters() {
    return {
      statuses: ["active", "inactive", "paused", "todo", "in_progress", "blocked", "done"],
      priorities: ["low", "medium", "high", "urgent"],
      types: ["agent", "task", "dependency"],
    }
  }
}
