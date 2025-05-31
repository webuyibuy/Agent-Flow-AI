"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Activity } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface RealtimeStatusIndicatorProps {
  channels?: string[] // Optional list of channel names to monitor
  className?: string
}

export default function RealtimeStatusIndicator({ channels = [], className }: RealtimeStatusIndicatorProps) {
  const [connectionStatus, setConnectionStatus] = useState<string>("connecting")
  const [activeChannels, setActiveChannels] = useState<number>(0)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    let testChannel: RealtimeChannel | null = null
    let isComponentMounted = true

    const setupConnectionMonitor = () => {
      // Create a test channel to monitor connection status
      testChannel = supabase.channel("connection-test").subscribe((status, err) => {
        if (!isComponentMounted) return

        console.log("Realtime connection status:", status)
        setConnectionStatus(status)

        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected")
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setConnectionStatus("disconnected")
        } else {
          setConnectionStatus(status)
        }
      })
    }

    const updateChannelCount = () => {
      if (!isComponentMounted) return

      try {
        // Count active channels from the supabase realtime instance
        const channelCount = supabase.realtime.channels.length
        setActiveChannels(channelCount)
      } catch (error) {
        console.warn("Could not get channel count:", error)
        setActiveChannels(0)
      }
    }

    // Setup connection monitoring
    setupConnectionMonitor()

    // Update channel count periodically
    const interval = setInterval(updateChannelCount, 2000)
    updateChannelCount() // Initial count

    return () => {
      isComponentMounted = false
      clearInterval(interval)
      if (testChannel) {
        supabase.removeChannel(testChannel)
      }
    }
  }, [supabase])

  const isConnected = connectionStatus === "connected" || connectionStatus === "SUBSCRIBED"

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge
        variant="outline"
        className={`text-xs ${
          isConnected
            ? "bg-green-50 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-300"
            : connectionStatus === "connecting"
              ? "bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300"
              : "bg-red-50 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-300"
        }`}
      >
        {isConnected ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
        {isConnected ? "Live" : connectionStatus === "connecting" ? "Connecting" : "Offline"}
      </Badge>
      {activeChannels > 0 && (
        <Badge
          variant="outline"
          className="text-xs bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300"
        >
          <Activity className="mr-1 h-3 w-3" />
          {activeChannels} channel{activeChannels !== 1 ? "s" : ""}
        </Badge>
      )}
    </div>
  )
}
