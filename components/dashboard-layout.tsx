"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  HomeIcon,
  ListChecksIcon,
  SettingsIcon,
  PlusCircleIcon,
  ZapIcon,
  MenuIcon,
  BarChart2Icon,
  StarIcon,
  ChevronRightIcon,
  LayoutTemplateIcon,
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import type { Badge as UserBadgeType } from "@/lib/gamification"
import RealtimeStatusIndicator from "@/components/realtime-status-indicator"
import NotificationCenter from "@/components/notification-center"
import { motion } from "framer-motion"
import { ProfileUpdater } from "./profile-updater"
import AdvancedSearch from "@/components/advanced-search"
import { ThemeToggle } from "@/components/theme-toggle"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/dashboard/dependencies", label: "Dependencies", icon: ListChecksIcon },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2Icon },
  { href: "/dashboard/settings/profile", label: "Settings", icon: SettingsIcon },
]

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

export default function DashboardLayoutClient({
  children,
  user,
  profile,
  totalXp,
  currentBadge,
  newAgentHref,
}: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User"
  const userEmail = user.email || "No email"
  const BadgeIcon = currentBadge?.icon

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="flex min-h-screen w-full bg-white dark:bg-black dashboard-layout">
      <ProfileUpdater />
      {/* Desktop Sidebar - Apple clean design */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl sm:flex">
        <nav className="flex flex-col gap-1 p-6">
          <Link
            href="/dashboard"
            className="mb-8 flex items-center gap-3 text-xl font-semibold text-blue-600 dark:text-blue-400"
            prefetch={false}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 shadow-sm">
              <ZapIcon className="h-6 w-6 text-white" />
            </div>
            <span>AgentFlow</span>
          </Link>

          {navItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white font-medium"
              asChild
            >
              <Link href={item.href} prefetch={false} className="flex items-center gap-3 py-3 px-3 rounded-lg">
                <item.icon className="h-5 w-5" />
                {item.label}
                <ChevronRightIcon className="ml-auto h-4 w-4 text-gray-400" />
              </Link>
            </Button>
          ))}
        </nav>

        <div className="mt-auto p-6 space-y-3">
          {/* Template button - Apple green */}
          <Link href="/onboarding/templates" className="block">
            <div className="w-full bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl shadow-sm transition-all duration-200 p-4 cursor-pointer">
              <div className="flex items-center justify-center gap-3">
                <LayoutTemplateIcon className="h-5 w-5" />
                Use Template
              </div>
            </div>
          </Link>

          {/* New agent button - Apple blue */}
          <Link href="/dashboard/agents/new" className="block">
            <div className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl shadow-sm transition-all duration-200 p-4 cursor-pointer">
              <div className="flex items-center justify-center gap-3">
                <PlusCircleIcon className="h-5 w-5" />
                New Agent
              </div>
            </div>
          </Link>
        </div>

        {/* User profile section */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white font-medium">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-gray-900 dark:text-white">{displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64 w-full">
        {/* Header - Clean Apple style */}
        <motion.header
          className={`sticky top-0 z-30 flex h-16 items-center justify-between gap-4 px-6 transition-all duration-200 ${
            scrolled
              ? "bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm"
              : "bg-transparent"
          }`}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Mobile Nav Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="sm:hidden">
              <Button size="icon" variant="ghost" className="relative">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="sm:hidden w-80 p-0 flex flex-col border-r-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl"
            >
              <SheetHeader className="p-6 border-b border-gray-200 dark:border-gray-800">
                <SheetTitle className="flex items-center gap-3 text-xl font-semibold text-blue-600 dark:text-blue-400">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
                    <ZapIcon className="h-6 w-6 text-white" />
                  </div>
                  <span>AgentFlow</span>
                </SheetTitle>
              </SheetHeader>

              {/* User Info Section */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white text-lg font-medium">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{displayName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <StarIcon className="h-3 w-3" />
                        {totalXp} XP
                      </Badge>
                      {currentBadge && <Badge variant="outline">{currentBadge.name}</Badge>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 flex flex-col gap-1 p-6 overflow-y-auto">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.label + "-mobile"}>
                    <Button variant="ghost" className="w-full justify-start h-14 text-base font-medium" asChild>
                      <Link href={item.href} prefetch={false} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {item.label}
                        <ChevronRightIcon className="ml-auto h-4 w-4 text-gray-400" />
                      </Link>
                    </Button>
                  </SheetClose>
                ))}
              </nav>

              {/* Action Buttons */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 space-y-3">
                <SheetClose asChild>
                  <Button variant="outline" size="lg" className="w-full" asChild>
                    <Link href="/onboarding/templates" className="flex items-center gap-2">
                      <LayoutTemplateIcon className="h-5 w-5" />
                      Use Template
                    </Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button size="lg" className="w-full bg-blue-500 hover:bg-blue-600" asChild>
                    <Link href="/dashboard/agents/new" className="flex items-center gap-2">
                      <PlusCircleIcon className="h-5 w-5" />
                      Create New Agent
                    </Link>
                  </Button>
                </SheetClose>
                <div className="flex justify-center mt-4">
                  <RealtimeStatusIndicator />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1 flex items-center justify-between">
            {/* Desktop Search */}
            <div className="hidden sm:flex items-center gap-4 flex-1 max-w-md">
              <AdvancedSearch userId={user.id} className="flex-1" />
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <NotificationCenter />
              <RealtimeStatusIndicator />
            </div>
          </div>
        </motion.header>

        <main className="flex-1 p-6 bg-white dark:bg-black">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>

        <footer className="w-full p-4 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 mt-auto bg-white/80 dark:bg-black/80 backdrop-blur-xl">
          AgentFlow &copy; {new Date().getFullYear()} • Designed for Apple Platforms
        </footer>
      </div>
    </div>
  )
}
