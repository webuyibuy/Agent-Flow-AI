import type React from "react"
import { LayoutDashboard, ListChecks, MessageSquare, Plus, Settings, User, LayoutTemplate } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen antialiased">
      <aside className="flex h-full w-64 flex-col border-r bg-white/10 py-3 dark:bg-gray-900">
        <Link href="/" className="flex items-center justify-center gap-2 px-4 py-2 font-bold">
          <LayoutDashboard className="h-6 w-6" />
          <span>Dashboard</span>
        </Link>
        <Separator className="my-2" />
        <nav className="flex flex-col space-y-1 px-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/dashboard/agents/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Agent
            </Link>
          </Button>

          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/onboarding/templates">
              <LayoutTemplate className="mr-2 h-4 w-4" />
              Create from Template
            </Link>
          </Button>

          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/tasks">
              <ListChecks className="mr-2 h-4 w-4" />
              Tasks
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/chat">
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </nav>
        <Separator className="my-2" />
        <div className="mt-auto px-2">
          <ModeToggle />
        </div>
      </aside>
      <div className="flex flex-col flex-1">
        <header className="z-10 flex items-center space-x-4 border-b bg-white/10 p-4 dark:bg-gray-900">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-2">
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
