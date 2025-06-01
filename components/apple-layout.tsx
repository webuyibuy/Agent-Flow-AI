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
  ChevronRightIcon,
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
  const pathname = usePathname()

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/80 backdrop-blur-xl border-r border-gray-200 px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <BrainIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">AgentFlow</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`
                        group flex gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 transition-all duration-200
                        ${
                          isActive
                            ? "bg-blue-50 text-blue-700 shadow-sm"
                            : "text-gray-700 hover:text-blue-700 hover:bg-gray-50"
                        }
                      `}
                    >
                      <item.icon
                        className={`h-5 w-5 shrink-0 ${isActive ? "text-blue-700" : "text-gray-400 group-hover:text-blue-700"}`}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto w-5 h-5 text-xs bg-blue-600 text-white rounded-full flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRightIcon
                        className={`h-4 w-4 transition-transform ${isActive ? "text-blue-700" : "text-gray-300 group-hover:text-blue-700"}`}
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Create Agent Button */}
            <div className="mt-auto">
              <Link
                href="/dashboard/agents/new"
                className="group flex w-full items-center gap-x-3 rounded-lg bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors duration-200"
              >
                <PlusIcon className="h-5 w-5" />
                Create Agent
              </Link>
            </div>

            {/* User Profile */}
            {user && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-x-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}
          </nav>
        </div>
      </aside>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-gray-200 lg:hidden"
            >
              <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <BrainIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-semibold text-gray-900">AgentFlow</span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 px-6 py-6">
                <ul className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className={`
                            group flex gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 transition-all duration-200
                            ${
                              isActive
                                ? "bg-blue-50 text-blue-700 shadow-sm"
                                : "text-gray-700 hover:text-blue-700 hover:bg-gray-50"
                            }
                          `}
                        >
                          <item.icon
                            className={`h-5 w-5 shrink-0 ${isActive ? "text-blue-700" : "text-gray-400 group-hover:text-blue-700"}`}
                          />
                          <span className="flex-1">{item.label}</span>
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

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Navigation */}
        <motion.header
          className={`
            sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b px-4 sm:gap-x-6 sm:px-6 lg:px-8 transition-all duration-300
            ${isScrolled ? "bg-white/80 backdrop-blur-xl border-gray-200 shadow-sm" : "bg-white border-gray-200"}
          `}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Mobile menu button */}
          <button
            type="button"
            className="p-2.5 text-gray-700 lg:hidden rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 max-w-md">
              <SearchIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 pl-3" />
              <input
                className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm bg-transparent"
                placeholder="Search agents, tasks..."
                type="search"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* Notifications */}
            <button className="relative p-2.5 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors">
              <BellIcon className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>

            {/* User menu */}
            {user && (
              <div className="hidden lg:block">
                <div className="flex items-center gap-x-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                </div>
              </div>
            )}
          </div>
        </motion.header>

        {/* Page Content */}
        <main className="py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="px-4 sm:px-6 lg:px-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
