"use client"

import { getSupabaseFromServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { BrainIcon, TargetIcon, CheckCircleIcon, TrendingUpIcon, PlusIcon, ArrowRightIcon } from "lucide-react"

import AppleLayout from "@/components/apple-layout"
import AppleButton from "@/components/apple-button"
import AppleCard from "@/components/apple-card"
import AppleStatCard from "@/components/apple-stat-card"

// Animation variants for staggered animations
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
}

export default async function DashboardPage() {
  const supabase = getSupabaseFromServer()

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch agents
  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  // Fetch tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  // Fetch dependencies
  const { data: dependencies } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_dependency", true)
    .order("created_at", { ascending: false })
    .limit(3)

  // Stats data
  const stats = [
    { 
      title: "Active Agents", 
      value: agents?.filter(a => a.status === "active").length || 0, 
      trend: { value: "2", direction: "up", label: "from last week" }, 
      icon: <BrainIcon className="w-6 h-6" /> 
    },
    { 
      title: "Completed Tasks", 
      value: tasks?.filter(t => t.status === "completed").length || 0, 
      trend: { value: "5", direction: "up", label: "from yesterday" }, 
      icon: <CheckCircleIcon className="w-6 h-6" /> 
    },
    { 
      title: "Dependencies", 
      value: dependencies?.length || 0, 
      trend: { value: "1", direction: "down", label: "from yesterday" }, 
      icon: <TargetIcon className="w-6 h-6" /> 
    },
    { 
      title: "Success Rate", 
      value: "94%", 
      trend: { value: "2%", direction: "up", label: "from last month" }, 
      icon: <TrendingUpIcon className="w-6 h-6" /> 
    },
  ]

  // User data
  const user = {
    name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
    email: session.user.email || "user@example.com",
  }

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { variant: "success" as const, dot: true, pulse: true }
      case "paused":
        return { variant: "warning" as const, dot: true, pulse: false }
      case "completed":
        return { variant: "success" as const, dot: false, pulse: false }
      case "in_progress":
        return { variant: "primary" as const, dot: true, pulse: true }
      case "pending":
        return { variant: "neutral" as const, dot: true, pulse: false }
      default:
        return { variant: "default" as const, dot: false, pulse: false }
    }
  }

  // Get priority badge variant
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "danger" as const
      case "medium":
        return "warning" as const
      case "low":
        return "success" as const
      default:
        return "neutral" as const
    }
  }

  return (
    <AppleLayout user={user}>
      <motion.div 
        className="space-y-8"
        initial="hidden"
        animate="show"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-3xl font-semibold text-[#1C1C1E] tracking-tight">Dashboard</h1>
            <p className="text-[#8E8E93] mt-1">Welcome back, {user.name}! Here's what's happening with your agents.</p>
          </div>
          <AppleButton 
            variant="primary" 
            size="lg" 
            icon={<PlusIcon className="w-5 h-5" />}
            className="shadow-md"
          >
            <Link href="/dashboard/agents/new">Create Agent</Link>
          </AppleButton>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={itemVariants}
        >
          {stats.map((stat, index) => (
            <AppleStatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              trend={stat.trend}
              icon={stat.icon}
            />
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Agents */}
          <motion.div variants={itemVariants}>
            <AppleCard variant="elevated" padding="lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BrainIcon className="w-5 h-5 text-[#0369A1]" />
                  <h2 className="text-xl font-semibold text-[#1C1C1E]">Recent Agents</h2>
                </div>
                <Link 
                  href="/dashboard/agents" 
                  className="text-[#0369A1] hover:text-[#075985] text-sm font-medium flex items-center gap-1 group"
                >
                  View all
                  <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {agents && agents.length > 0 ? (
                  agents.map((agent) => (
                    <motion.div
                      key={agent.id}
                      whileHover={{ x: 4 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Link href={`/dashboard/agents/${agent.id}`}>
                        <AppleCard 
                          variant="subtle" 
                          padding="\
