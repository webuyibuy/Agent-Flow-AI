"use client" // Add 'use client' for useState and event handlers

import type React from "react"
import { useState } from "react"
import Link from "next/link"
// Removed redirect and getSupabaseFromServer as this is now a client component for the layout shell.
// Data fetching for user/profile will be passed as props or handled by child server components.
import { Button } from "@/components/ui/button"
import { LayoutDashboard, ListChecks, Settings, PlusCircle, Zap, Menu, BarChart3 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import type { Badge as UserBadgeType } from "@/lib/gamification" // Assuming this type is still needed
import RealtimeStatusIndicator from "@/components/realtime-status-indicator"
import NotificationCenter from "@/components/notification-center"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/dependencies", label: "Dependency Basket", icon: ListChecks },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings/profile", label: "Settings", icon: Settings },
]

// Props for the layout, including user data fetched by parent server components
interface DashboardLayoutProps {
  children: React.ReactNode
  user: {
    id: string
    email?: string
  }
  profile: {
    display_name?: string | null
  } | null
  totalXp: number
  currentBadge: UserBadgeType | null
  newAgentHref: string
}

// This is now a client component because of useState for mobile nav
export default function DashboardLayoutClient({
  children,
  user,
  profile,
  totalXp,
  currentBadge,
  newAgentHref,
}: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User"
  const userEmail = user.email || "No email"

  const BadgeIcon = currentBadge?.icon

  return (
    <div className="flex min-h-screen w-full bg-gray-100 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r bg-white dark:bg-gray-800 sm:flex">
        <nav className="flex flex-col gap-2 p-4">
          <Link
            href="/dashboard"
            className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#007AFF]"
            prefetch={false}
          >
            <Zap className="h-7 w-7" />
            <span>AgentFlow</span>
          </Link>
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className="w-full justify-start dark:text-gray-300 dark:hover:bg-gray-700"
              asChild
            >
              <Link href={item.href} prefetch={false}>
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="mt-auto p-4">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/dashboard/agents/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Agent
            </Link>
          </Button>
        </div>
      </aside>

      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64 w-full">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-white dark:bg-gray-800 px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          {/* Mobile Nav Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="sm:hidden">
              <Button size="icon" variant="outline" className="relative">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:hidden w-80 p-0 flex flex-col">
              <SheetHeader className="p-4 border-b bg-white dark:bg-gray-800">
                <SheetTitle className="flex items-center gap-2 text-lg font-semibold text-[#007AFF]">
                  <Zap className="h-7 w-7" />
                  <span>AgentFlow</span>
                </SheetTitle>
              </SheetHeader>

              {/* User Info Section */}
              <div className="p-4 border-b bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  {BadgeIcon && (
                    <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                      <BadgeIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{displayName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{totalXp} XP</p>
                    {currentBadge && (
                      <p className="text-xs text-orange-600 dark:text-orange-400">{currentBadge.name}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 flex flex-col gap-1 p-4">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.label + "-mobile"}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-12 text-base dark:text-gray-300 dark:hover:bg-gray-700"
                      asChild
                    >
                      <Link href={item.href} prefetch={false}>
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.label}
                      </Link>
                    </Button>
                  </SheetClose>
                ))}
              </nav>

              {/* Action Buttons */}
              <div className="p-4 border-t bg-gray-50 dark:bg-gray-800/50 space-y-2">
                <SheetClose asChild>
                  <Button className="w-full bg-[#007AFF] hover:bg-[#0056b3] text-white" asChild>
                    <Link href="/dashboard/agents/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create New Agent
                    </Link>
                  </Button>
                </SheetClose>
                <div className="flex justify-center">
                  <RealtimeStatusIndicator />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1 flex items-center justify-between">
            {/* Desktop User Info */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-2">
                {BadgeIcon && (
                  <div className="p-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <BadgeIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{displayName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {totalXp} XP {currentBadge && `• ${currentBadge.name}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationCenter />
              <RealtimeStatusIndicator />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 bg-gray-50 dark:bg-gray-950 sm:rounded-tl-xl">{children}</main>
        <footer className="w-full p-4 text-center text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 mt-auto sm:rounded-bl-xl bg-white dark:bg-gray-800">
          AgentFlow &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  )
}
