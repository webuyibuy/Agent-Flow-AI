"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutGridIcon,
  BrainIcon,
  TargetIcon,
  BarChart3Icon,
  SettingsIcon,
  PlusIcon,
  BellIcon,
  SearchIcon,
  MenuIcon,
  XIcon,
  UsersIcon,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}

const navigation: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGridIcon },
  { href: "/dashboard/agents", label: "Agents", icon: BrainIcon },
  { href: "/dashboard/dependencies", label: "Dependencies", icon: TargetIcon, badge: 3 },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3Icon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
]

const tools: NavItem[] = [
  { href: "/dashboard/agents/new", label: "Create Agent", icon: PlusIcon },
  { href: "/dashboard/team", label: "Team Management", icon: UsersIcon },
]

interface AppleLayoutProps {
  children: React.ReactNode
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

export default function AppleLayout({ children, user }: AppleLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const pathname = usePathname()

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:overflow-y-auto lg:border-r lg:border-gray-200 lg:bg-white lg:pb-4">
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <BrainIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">AgentFlow</span>
          </Link>
        </div>
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`
                    group flex items-center rounded-md px-3 py-2 text-sm font-medium
                    ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"}
                  `}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"}`}
                  />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Business Tools</h3>
            <div className="mt-2 space-y-1">
              {tools.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>
        {user && (
          <div className="mt-auto border-t border-gray-200 pt-4 px-3">
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ translateX: "-100%" }}
              animate={{ translateX: 0 }}
              exit={{ translateX: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto bg-white pb-12 lg:hidden"
            >
              <div className="flex items-center justify-between px-4 pt-5 pb-2">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <BrainIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">AgentFlow</span>
                </Link>
                <button
                  type="button"
                  className="-mr-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <XIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <nav className="mt-5 px-2">
                <div className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`
                          group flex items-center rounded-md px-3 py-2 text-sm font-medium
                          ${
                            isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          }
                        `}
                      >
                        <item.icon
                          className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"}`}
                        />
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
                <div className="mt-8">
                  <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Business Tools</h3>
                  <div className="mt-2 space-y-1">
                    {tools.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top header */}
      <header
        className={`lg:pl-64 sticky top-0 z-10 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 ${
          isScrolled ? "shadow-md" : ""
        }`}
      >
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <MenuIcon className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Logo for mobile */}
        <div className="flex lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <BrainIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">AgentFlow</span>
          </Link>
        </div>

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="relative flex flex-1 items-center">
            <SearchIcon className="pointer-events-none absolute left-4 h-5 w-5 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              name="search"
              id="search"
              placeholder="Search agents, tasks..."
              className="h-10 block w-full rounded-full border-0 bg-gray-50 py-1.5 pl-12 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              className="-m-1.5 flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <BellIcon className="h-6 w-6" aria-hidden="true" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-medium text-white">
                2
              </span>
            </button>

            {/* Notifications dropdown */}
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-lg bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <div className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <TargetIcon className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-3 w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">New Task Assigned</p>
                          <p className="mt-1 text-sm text-gray-500">Process customer inquiries</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <BrainIcon className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-3 w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">Agent Status Update</p>
                          <p className="mt-1 text-sm text-gray-500">Customer Support Agent is now active</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <div className="flex items-center gap-x-3">
              {user && (
                <>
                  <div className="hidden lg:flex lg:items-center lg:gap-x-2">
                    <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="lg:pl-64 py-8">
        <div className="px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  )
}
