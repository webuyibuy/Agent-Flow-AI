"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  HomeIcon,
  BrainIcon,
  TargetIcon,
  BarChart3Icon,
  SettingsIcon,
  PlusIcon,
  BellIcon,
  SearchIcon,
  MenuIcon,
  XIcon,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}

const navigation: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/dashboard/agents", label: "Agents", icon: BrainIcon },
  { href: "/dashboard/dependencies", label: "Dependencies", icon: TargetIcon, badge: 3 },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3Icon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
]

interface AppLayoutProps {
  children: React.ReactNode
  user?: {
    name: string
    email: string
  }
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <BrainIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">AgentFlow</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className={`group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-medium transition-all duration-200 ${
                            isActive
                              ? "bg-blue-50 text-blue-700 shadow-sm"
                              : "text-gray-700 hover:text-blue-700 hover:bg-gray-50"
                          }`}
                        >
                          <item.icon
                            className={`h-5 w-5 shrink-0 ${
                              isActive ? "text-blue-700" : "text-gray-400 group-hover:text-blue-700"
                            }`}
                          />
                          {item.label}
                          {item.badge && (
                            <span className="ml-auto w-5 h-5 text-xs bg-blue-600 text-white rounded-full flex items-center justify-center">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
              <li className="mt-auto">
                <Link
                  href="/dashboard/agents/new"
                  className="group -mx-2 flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors duration-200 shadow-lg"
                >
                  <PlusIcon className="h-5 w-5 shrink-0" />
                  Create Agent
                </Link>
              </li>
            </ul>
          </nav>

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-x-4 px-3 py-3 text-sm font-semibold leading-6 text-gray-900 border-t border-gray-200">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="sr-only">Your profile</span>
              <div className="flex flex-col">
                <span aria-hidden="true">{user.name}</span>
                <span className="text-xs text-gray-500">{user.email}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10"
            >
              <div className="flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    <BrainIcon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-semibold text-gray-900">AgentFlow</span>
                </Link>
                <button
                  type="button"
                  className="-m-2.5 rounded-md p-2.5 text-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <XIcon className="h-6 w-6" />
                </button>
              </div>
              <nav className="mt-6">
                <ul role="list" className="space-y-2">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className={`group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-medium ${
                            isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:text-blue-700 hover:bg-gray-50"
                          }`}
                        >
                          <item.icon
                            className={`h-5 w-5 shrink-0 ${
                              isActive ? "text-blue-700" : "text-gray-400 group-hover:text-blue-700"
                            }`}
                          />
                          {item.label}
                          {item.badge && (
                            <span className="ml-auto w-5 h-5 text-xs bg-blue-600 text-white rounded-full flex items-center justify-center">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div
          className={`sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/80 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 transition-all duration-200 ${
            isScrolled ? "shadow-md" : ""
          }`}
        >
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <MenuIcon className="h-6 w-6" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <form className="relative flex flex-1" action="#" method="GET">
              <label htmlFor="search-field" className="sr-only">
                Search
              </label>
              <SearchIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 pl-3" />
              <input
                id="search-field"
                className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm bg-transparent"
                placeholder="Search agents, tasks..."
                type="search"
                name="search"
              />
            </form>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                <BellIcon className="h-6 w-6" />
              </button>

              {/* Separator */}
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

              {/* Profile dropdown */}
              {user && (
                <div className="flex items-center gap-x-3">
                  <div className="hidden lg:flex lg:items-center lg:gap-x-2">
                    <span className="text-sm font-semibold leading-6 text-gray-900">{user.name}</span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
