"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
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
  UserIcon,
  LogOutIcon,
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const pathname = usePathname()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)

  // Scroll animations
  const { scrollY } = useScroll()
  const headerOpacity = useTransform(scrollY, [0, 50], [0, 1])
  const headerBlur = useTransform(scrollY, [0, 50], [0, 8])

  // Handle click outside user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isUserMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isUserMenuOpen])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/80 backdrop-blur-xl border-r border-[#E5E5EA] px-6">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#0369A1] to-[#0EA5E9] rounded-lg flex items-center justify-center shadow-sm">
                <BrainIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-[#1C1C1E] tracking-tight">AgentFlow</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col pt-2">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`
                        group flex gap-x-3 rounded-lg p-2.5 text-sm font-medium leading-6 transition-all duration-200
                        ${
                          isActive
                            ? "bg-[#F0F7FF] text-[#0369A1] shadow-sm"
                            : "text-[#3A3A3C] hover:text-[#0369A1] hover:bg-[#F9FAFB]"
                        }
                      `}
                    >
                      <item.icon
                        className={`h-5 w-5 shrink-0 ${isActive ? "text-[#0369A1]" : "text-[#8E8E93] group-hover:text-[#0369A1]"}`}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto w-5 h-5 text-xs bg-[#0369A1] text-white rounded-full flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Create Agent Button */}
            <div className="mt-auto pt-4 pb-6">
              <Link
                href="/dashboard/agents/new"
                className="group flex w-full items-center gap-x-3 rounded-lg bg-[#0369A1] px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#075985] transition-colors duration-200"
              >
                <PlusIcon className="h-5 w-5" />
                Create Agent
              </Link>
            </div>

            {/* User Profile */}
            {user && (
              <div className="relative">
                <button
                  ref={userButtonRef}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-full flex items-center gap-x-3 p-2.5 rounded-lg hover:bg-[#F9FAFB] transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#0369A1] to-[#38BDF8] flex items-center justify-center text-white font-medium shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-[#1C1C1E] truncate">{user.name}</p>
                    <p className="text-xs text-[#8E8E93] truncate">{user.email}</p>
                  </div>
                  <ChevronRightIcon
                    className={`h-4 w-4 text-[#8E8E93] transition-transform duration-200 ${isUserMenuOpen ? "rotate-90" : ""}`}
                  />
                </button>

                {/* User Menu */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      ref={userMenuRef}
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="absolute bottom-full mb-2 left-0 w-full bg-white rounded-lg shadow-lg border border-[#E5E5EA] overflow-hidden z-50"
                    >
                      <div className="p-2 space-y-1">
                        <Link
                          href="/dashboard/settings/profile"
                          className="flex items-center gap-x-3 px-3 py-2 text-sm text-[#1C1C1E] rounded-md hover:bg-[#F9FAFB]"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <UserIcon className="h-4 w-4 text-[#8E8E93]" />
                          Profile Settings
                        </Link>
                        <Link
                          href="/login"
                          className="flex items-center gap-x-3 px-3 py-2 text-sm text-[#1C1C1E] rounded-md hover:bg-[#F9FAFB]"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <LogOutIcon className="h-4 w-4 text-[#8E8E93]" />
                          Sign Out
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-[#E5E5EA] lg:hidden"
            >
              <div className="flex h-16 items-center justify-between px-6 border-b border-[#E5E5EA]">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#0369A1] to-[#0EA5E9] rounded-lg flex items-center justify-center shadow-sm">
                    <BrainIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-semibold text-[#1C1C1E] tracking-tight">AgentFlow</span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-[#8E8E93] hover:text-[#3A3A3C] hover:bg-[#F9FAFB]"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6">
                <ul className="space-y-2">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className={`
                            group flex gap-x-3 rounded-lg p-2.5 text-sm font-medium leading-6 transition-all duration-200
                            ${
                              isActive
                                ? "bg-[#F0F7FF] text-[#0369A1] shadow-sm"
                                : "text-[#3A3A3C] hover:text-[#0369A1] hover:bg-[#F9FAFB]"
                            }
                          `}
                        >
                          <item.icon
                            className={`h-5 w-5 shrink-0 ${isActive ? "text-[#0369A1]" : "text-[#8E8E93] group-hover:text-[#0369A1]"}`}
                          />
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto w-5 h-5 text-xs bg-[#0369A1] text-white rounded-full flex items-center justify-center">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>

                {/* Create Agent Button - Mobile */}
                <div className="mt-6 pt-6 border-t border-[#E5E5EA]">
                  <Link
                    href="/dashboard/agents/new"
                    className="group flex w-full items-center gap-x-3 rounded-lg bg-[#0369A1] px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#075985] transition-colors duration-200"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Create Agent
                  </Link>
                </div>

                {/* User Profile - Mobile */}
                {user && (
                  <div className="mt-6 pt-6 border-t border-[#E5E5EA]">
                    <div className="flex items-center gap-x-3 p-2">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#0369A1] to-[#38BDF8] flex items-center justify-center text-white font-medium shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1C1C1E] truncate">{user.name}</p>
                        <p className="text-xs text-[#8E8E93] truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <Link
                        href="/dashboard/settings/profile"
                        className="flex items-center gap-x-3 px-3 py-2 text-sm text-[#1C1C1E] rounded-md hover:bg-[#F9FAFB]"
                      >
                        <UserIcon className="h-4 w-4 text-[#8E8E93]" />
                        Profile Settings
                      </Link>
                      <Link
                        href="/login"
                        className="flex items-center gap-x-3 px-3 py-2 text-sm text-[#1C1C1E] rounded-md hover:bg-[#F9FAFB]"
                      >
                        <LogOutIcon className="h-4 w-4 text-[#8E8E93]" />
                        Sign Out
                      </Link>
                    </div>
                  </div>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Navigation */}
        <motion.header
          style={{
            boxShadow: scrollY.get() > 10 ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
            backdropFilter: `blur(${headerBlur.get()}px)`,
            backgroundColor: `rgba(255, 255, 255, ${headerOpacity.get()})`,
          }}
          className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b border-[#E5E5EA] px-4 sm:gap-x-6 sm:px-6 lg:px-8 transition-all duration-300"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Mobile menu button */}
          <button
            type="button"
            className="p-2.5 text-[#3A3A3C] lg:hidden rounded-lg hover:bg-[#F9FAFB] transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 max-w-md">
              <motion.div
                className={`absolute inset-0 rounded-lg ${isSearchFocused ? "ring-2 ring-[#0369A1] ring-offset-0" : ""}`}
                initial={false}
                animate={{
                  backgroundColor: isSearchFocused ? "rgba(249, 250, 251, 1)" : "rgba(249, 250, 251, 0.8)",
                  boxShadow: isSearchFocused ? "0 1px 3px rgba(0,0,0,0.1)" : "0 1px 2px rgba(0,0,0,0.05)",
                }}
                transition={{ duration: 0.2 }}
              />
              <SearchIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-[#8E8E93] ml-3" />
              <input
                className="block h-9 w-full border-0 py-0 pl-10 pr-3 text-[#1C1C1E] placeholder:text-[#8E8E93] focus:ring-0 sm:text-sm bg-transparent relative z-10"
                placeholder="Search agents, tasks..."
                type="search"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* Notifications */}
            <button className="relative p-2.5 text-[#8E8E93] hover:text-[#3A3A3C] rounded-lg hover:bg-[#F9FAFB] transition-colors">
              <BellIcon className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#FF3B30] text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>

            {/* User menu - Desktop */}
            {user && (
              <div className="hidden lg:block">
                <button
                  ref={userButtonRef}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-x-3 p-1.5 rounded-lg hover:bg-[#F9FAFB] transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#0369A1] to-[#38BDF8] flex items-center justify-center text-white text-sm font-medium shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-[#1C1C1E]">{user.name}</span>
                  <ChevronRightIcon
                    className={`h-4 w-4 text-[#8E8E93] transition-transform duration-200 ${isUserMenuOpen ? "rotate-90" : ""}`}
                  />
                </button>

                {/* User Menu - Desktop */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      ref={userMenuRef}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="absolute right-8 mt-2 w-56 bg-white rounded-lg shadow-lg border border-[#E5E5EA] overflow-hidden z-50"
                    >
                      <div className="p-2 space-y-1">
                        <Link
                          href="/dashboard/settings/profile"
                          className="flex items-center gap-x-3 px-3 py-2 text-sm text-[#1C1C1E] rounded-md hover:bg-[#F9FAFB]"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <UserIcon className="h-4 w-4 text-[#8E8E93]" />
                          Profile Settings
                        </Link>
                        <Link
                          href="/login"
                          className="flex items-center gap-x-3 px-3 py-2 text-sm text-[#1C1C1E] rounded-md hover:bg-[#F9FAFB]"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <LogOutIcon className="h-4 w-4 text-[#8E8E93]" />
                          Sign Out
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
