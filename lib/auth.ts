// Simple mock authentication
interface User {
  id: string
  email: string
  display_name: string
}

interface Session {
  user: User
  access_token: string
}

class MockAuth {
  private currentUser: User | null = null
  private currentSession: Session | null = null

  async getSession() {
    return { data: { session: this.currentSession }, error: null }
  }

  async getUser() {
    return { data: { user: this.currentUser }, error: null }
  }

  async signInWithPassword(credentials: { email: string; password: string }) {
    // Mock successful login
    const user: User = {
      id: "1",
      email: credentials.email,
      display_name: "Demo User",
    }

    const session: Session = {
      user,
      access_token: "mock-token",
    }

    this.currentUser = user
    this.currentSession = session

    return { data: { user, session }, error: null }
  }

  async signUp(credentials: { email: string; password: string }) {
    return this.signInWithPassword(credentials)
  }

  async signOut() {
    this.currentUser = null
    this.currentSession = null
    return { error: null }
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    // Mock auth state change listener
    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    }
  }
}

export const auth = new MockAuth()
