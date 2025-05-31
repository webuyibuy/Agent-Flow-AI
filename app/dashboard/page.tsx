import { Button } from "@/components/ui/button"
import { PlusCircle, CheckCircle, Zap, Star, Settings } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  getCurrentBadge,
  getNextBadge,
  POINTS_PER_TASK_COMPLETION,
  badges as allBadgesConfig,
} from "@/lib/gamification"
import { Progress } from "@/components/ui/progress"
import { getDefaultUserId } from "@/lib/default-user"

// Define available agent statuses for filtering
const AGENT_STATUSES = ["active", "paused", "completed", "error"] as const
type AgentStatus = (typeof AGENT_STATUSES)[number]

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { query?: string; status?: string; newAgent?: string }
}) {
  // Get user ID without Supabase calls
  const userId = await getDefaultUserId()
  const newAgentHref = "/dashboard/agents/new"

  // Use mock/default data instead of fetching from Supabase
  const totalXp = 0
  const currentBadge = getCurrentBadge(totalXp)
  const nextBadge = getNextBadge(totalXp)

  let progressToNextBadge = 0
  let xpForNextBadge = 0
  if (nextBadge) {
    const xpEarnedTowardsNext = totalXp - (currentBadge?.threshold || 0)
    const xpNeededForNextOverall = nextBadge.threshold - (currentBadge?.threshold || 0)
    progressToNextBadge = xpNeededForNextOverall > 0 ? (xpEarnedTowardsNext / xpNeededForNextOverall) * 100 : 0
    xpForNextBadge = nextBadge.threshold
  } else if (currentBadge) {
    progressToNextBadge = 100
  }

  // Mock empty agents array instead of fetching from Supabase
  const agents: any[] = []
  const agentsError = null

  const newAgentId = searchParams?.newAgent
  const CurrentBadgeIcon = currentBadge?.icon

  return (
    <main className="flex-1 p-6">
      {newAgentId && (
        <Alert className="mb-6 bg-green-50 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300">
          <CheckCircle className="h-4 w-4 !text-green-700 dark:!text-green-300" />
          <AlertTitle>Agent Deployed!</AlertTitle>
          <AlertDescription>
            Your new agent has been successfully created and initial tasks are being set up.
          </AlertDescription>
        </Alert>
      )}

      {/* Gamification Cards with default/mock data */}
      <div className="mb-6 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalXp}</div>
            <p className="text-xs text-muted-foreground">Keep completing tasks to earn more!</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Badge</CardTitle>
            {CurrentBadgeIcon && <CurrentBadgeIcon className="h-5 w-5 text-orange-400" />}
          </CardHeader>
          <CardContent>
            {currentBadge ? (
              <>
                <div className="text-2xl font-bold">{currentBadge.name}</div>
                <p className="text-xs text-muted-foreground">{currentBadge.description}</p>
                {nextBadge ? (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress to {nextBadge.name}</span>
                      <span className="font-medium">
                        {totalXp} / {xpForNextBadge} XP
                      </span>
                    </div>
                    <Progress value={progressToNextBadge} className="h-2" />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">You've earned the highest badge!</p>
                )}
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">No Badge Yet</div>
                <p className="text-xs text-muted-foreground">
                  Earn {allBadgesConfig[allBadgesConfig.length - 1].threshold} XP to get your first badge!
                </p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">
                      Progress to {allBadgesConfig[allBadgesConfig.length - 1].threshold}
                    </span>
                    <span className="font-medium">
                      {totalXp} / {allBadgesConfig[allBadgesConfig.length - 1].threshold} XP
                    </span>
                  </div>
                  <Progress
                    value={(totalXp / allBadgesConfig[allBadgesConfig.length - 1].threshold) * 100}
                    className="h-2"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(totalXp / POINTS_PER_TASK_COMPLETION)}</div>
            <p className="text-xs text-muted-foreground">Across all your agents.</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Your Agents</h2>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button asChild className="bg-[#007AFF] hover:bg-[#0056b3] text-white">
            <Link href="/dashboard/agents/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Agent
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/agents/manage">
              <Settings className="mr-2 h-4 w-4" />
              Manage Agents
            </Link>
          </Button>
        </div>
      </div>

      {/* Show empty state since we're not fetching agents */}
      <div className="text-center py-8 sm:py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
        <Zap className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Database Connection Disabled
        </h3>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 px-4">
          Supabase functionality has been temporarily disabled to prevent connection errors.
        </p>
        <Button asChild size="lg" className="bg-[#007AFF] hover:bg-[#0056b3] text-white">
          <Link href="/dashboard/agents/new">
            <PlusCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Create Your First Agent
          </Link>
        </Button>
      </div>
    </main>
  )
}
