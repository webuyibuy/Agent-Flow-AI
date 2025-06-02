"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

interface AuthFormProps {
  onSwitchForm: (formType: "signin" | "signup" | "forgot-password") => void
}

export function SignInForm({ onSwitchForm }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = getSupabaseBrowserClient()

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
    } else {
      setMessage("Signed in successfully! Redirecting...")
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm space-y-8 mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">AgentFlow</h1>
        <p className="text-gray-600 dark:text-gray-400 text-base">Sign in to manage your AI agents</p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email-signin" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Email
          </Label>
          <Input
            id="email-signin"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password-signin" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Password
          </Label>
          <Input
            id="password-signin"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      <div className="text-center space-y-4">
        <button
          onClick={() => onSwitchForm("signup")}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
        >
          Don't have an account? Sign Up
        </button>
        <br />
        <button
          onClick={() => onSwitchForm("forgot-password")}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
        >
          Forgot your password?
        </button>
      </div>

      {message && (
        <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <Terminal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">Success</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
          <Terminal className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-800 dark:text-red-200">Error</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        By signing in, you agree to our Terms of Service
      </p>
    </div>
  )
}

export function SignUpForm({ onSwitchForm }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = getSupabaseBrowserClient()

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
    } else if (data.user) {
      setMessage("Sign up successful! Please check your email to confirm your account.")
    } else {
      setMessage("Sign up successful! Please check your email to confirm your account.")
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm space-y-8 mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">AgentFlow</h1>
        <p className="text-gray-600 dark:text-gray-400 text-base">Create your AI AgentFlow account</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username-signup" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Username
          </Label>
          <Input
            id="username-signup"
            type="text"
            placeholder="your_username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="h-12 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-signup" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Email
          </Label>
          <Input
            id="email-signup"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password-signup" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Password
          </Label>
          <Input
            id="password-signup"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </Button>
      </form>

      <div className="text-center">
        <button
          onClick={() => onSwitchForm("signin")}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
        >
          Already have an account? Sign In
        </button>
      </div>

      {message && (
        <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <Terminal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">Success</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
          <Terminal className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-800 dark:text-red-200">Error</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        By signing up, you agree to our Terms of Service
      </p>
    </div>
  )
}

export function ForgotPasswordForm({ onSwitchForm }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = getSupabaseBrowserClient()

  const handlePasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
    } else {
      setMessage("Password reset email sent. Check your inbox!")
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm space-y-8 mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">AgentFlow</h1>
        <p className="text-gray-600 dark:text-gray-400 text-base">Reset your password</p>
      </div>

      <form onSubmit={handlePasswordReset} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email-forgot" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Email
          </Label>
          <Input
            id="email-forgot"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <div className="text-center">
        <button
          onClick={() => onSwitchForm("signin")}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
        >
          Back to Sign In
        </button>
      </div>

      {message && (
        <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <Terminal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">Success</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
          <Terminal className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-800 dark:text-red-200">Error</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
