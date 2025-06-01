import type React from "react"
import { Suspense } from "react"
import { getSupabaseFromServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Brain, LayoutDashboard, Target, Settings, BarChart3, Users, LogOut, Loader2, Rocket } from "lucide-react"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseFromServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r hidden md:block">
        <div className="h-16 border-b flex items-center px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-lg">AgentFlow</span>
          </Link>
        </div>
        <div className="p-4">
          <nav className="space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100">
              <LayoutDashboard className="h-5 w-5 text-gray-500" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/dashboard/agents/manage"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100"
            >
              <Brain className="h-5 w-5 text-gray-500" />
              <span>Business Agents</span>
            </Link>
            <Link
              href="/dashboard/dependencies"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100"
            >
              <Target className="h-5 w-5 text-gray-500" />
              <span>Dependencies</span>
            </Link>
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100"
            >
              <BarChart3 className="h-5 w-5 text-gray-500" />
              <span>Analytics</span>
            </Link>
            <Link
              href="/dashboard/settings/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100"
            >
              <Settings className="h-5 w-5 text-gray-500" />
              <span>Settings</span>
            </Link>
          </nav>

          <div className="mt-8">
            <p className="px-3 text-xs font-medium text-gray-400 uppercase">Business Tools</p>
            <nav className="mt-2 space-y-1">
              <Link
                href="/dashboard/agents/new"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <Rocket className="h-5 w-5 text-gray-500" />
                <span>Create Agent</span>
              </Link>
              <Link
                href="/dashboard/notifications"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <Users className="h-5 w-5 text-gray-500" />
                <span>Team Management</span>
              </Link>
            </nav>
          </div>
        </div>

        <div className="absolute bottom-0 w-64 p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              {profile?.full_name
                ? profile.full_name.charAt(0).toUpperCase()
                : session.user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{profile?.full_name || session.user.email?.split("@")[0]}</p>
              <p className="text-xs text-gray-500">{session.user.email}</p>
            </div>
          </div>
          <form action="/api/auth/signout" method="post">
            <Button variant="outline" size="sm" className="w-full flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b flex items-center justify-between px-4 z-10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-lg">AgentFlow</span>
        </Link>
        {/* Mobile menu button would go here */}
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-64 md:pt-0 pt-16">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
  )
}
