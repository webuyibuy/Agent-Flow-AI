// Temporary mock database to replace Supabase functionality
export interface User {
  id: string
  email: string
  name?: string
  created_at: string
}

export interface Agent {
  id: string
  name: string
  description: string
  user_id: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  agent_id: string
  status: "pending" | "in_progress" | "completed"
  created_at: string
}

// Mock data store
const mockUsers: User[] = [
  {
    id: "1",
    email: "user@example.com",
    name: "Demo User",
    created_at: new Date().toISOString(),
  },
]

const mockAgents: Agent[] = [
  {
    id: "1",
    name: "General Agent",
    description: "A helpful AI assistant",
    user_id: "1",
    created_at: new Date().toISOString(),
  },
]

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Sample Task",
    description: "This is a sample task",
    agent_id: "1",
    status: "pending",
    created_at: new Date().toISOString(),
  },
]

// Mock database operations
export const mockDatabase = {
  users: {
    findById: async (id: string): Promise<User | null> => {
      return mockUsers.find((user) => user.id === id) || null
    },
    findByEmail: async (email: string): Promise<User | null> => {
      return mockUsers.find((user) => user.email === email) || null
    },
    create: async (userData: Omit<User, "id" | "created_at">): Promise<User> => {
      const newUser: User = {
        ...userData,
        id: String(mockUsers.length + 1),
        created_at: new Date().toISOString(),
      }
      mockUsers.push(newUser)
      return newUser
    },
  },
  agents: {
    findByUserId: async (userId: string): Promise<Agent[]> => {
      return mockAgents.filter((agent) => agent.user_id === userId)
    },
    create: async (agentData: Omit<Agent, "id" | "created_at">): Promise<Agent> => {
      const newAgent: Agent = {
        ...agentData,
        id: String(mockAgents.length + 1),
        created_at: new Date().toISOString(),
      }
      mockAgents.push(newAgent)
      return newAgent
    },
  },
  tasks: {
    findByAgentId: async (agentId: string): Promise<Task[]> => {
      return mockTasks.filter((task) => task.agent_id === agentId)
    },
    create: async (taskData: Omit<Task, "id" | "created_at">): Promise<Task> => {
      const newTask: Task = {
        ...taskData,
        id: String(mockTasks.length + 1),
        created_at: new Date().toISOString(),
      }
      mockTasks.push(newTask)
      return newTask
    },
  },
}
