// Simple in-memory database for development
interface User {
  id: string
  email: string
  display_name: string
  created_at: string
}

interface Agent {
  id: string
  name: string
  description: string
  user_id: string
  created_at: string
}

interface Task {
  id: string
  title: string
  description: string
  status: string
  agent_id: string
  created_at: string
}

class MockDatabase {
  private users: User[] = [
    {
      id: "1",
      email: "demo@example.com",
      display_name: "Demo User",
      created_at: new Date().toISOString(),
    },
  ]

  private agents: Agent[] = [
    {
      id: "1",
      name: "General Assistant",
      description: "A helpful AI assistant",
      user_id: "1",
      created_at: new Date().toISOString(),
    },
  ]

  private tasks: Task[] = [
    {
      id: "1",
      title: "Welcome Task",
      description: "Get started with AgentFlow",
      status: "pending",
      agent_id: "1",
      created_at: new Date().toISOString(),
    },
  ]

  async getUsers() {
    return { data: this.users, error: null }
  }

  async getUser(id: string) {
    const user = this.users.find((u) => u.id === id)
    return { data: user || null, error: null }
  }

  async getAgents() {
    return { data: this.agents, error: null }
  }

  async getTasks() {
    return { data: this.tasks, error: null }
  }

  async createAgent(agent: Omit<Agent, "id" | "created_at">) {
    const newAgent = {
      ...agent,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    }
    this.agents.push(newAgent)
    return { data: newAgent, error: null }
  }

  async createTask(task: Omit<Task, "id" | "created_at">) {
    const newTask = {
      ...task,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    }
    this.tasks.push(newTask)
    return { data: newTask, error: null }
  }
}

export const db = new MockDatabase()
