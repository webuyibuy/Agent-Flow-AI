"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Check, Trash2, X } from "lucide-react"
import Link from "next/link"
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotificationAction,
} from "@/app/dashboard/notifications/actions"
import type { Notification } from "@/lib/notifications"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client" // For real-time

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "success":
    case "task_complete":
      return <Check className="h-4 w-4 text-green-500" />
    case "warning":
      return <Bell className="h-4 w-4 text-yellow-500" />
    case "error":
      return <X className="h-4 w-4 text-red-500" />
    case "agent_update":
      return <Bell className="h-4 w-4 text-blue-500" />
    case "dependency_ready":
      return <Bell className="h-4 w-4 text-orange-500" />
    case "info":
    default:
      return <Bell className="h-4 w-4 text-gray-500" />
  }
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  const loadNotifications = async (includeRead = true) => {
    setIsLoading(true)
    startTransition(async () => {
      const result = await fetchNotifications(includeRead)
      if (result.success && result.notifications) {
        setNotifications(result.notifications)
        setUnreadCount(result.notifications.filter((n) => !n.is_read).length)
      } else if (result.error) {
        toast({
          title: "Error fetching notifications",
          description: result.error,
          variant: "destructive",
        })
      }
      setIsLoading(false)
    })
  }

  useEffect(() => {
    loadNotifications()

    const channel = supabase
      .channel("realtime-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, (payload) => {
        console.log("Realtime notification change:", payload)
        // Simple reload for now, can be optimized to update/add/remove specific notification
        loadNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      const result = await markAsRead(id)
      if (result.success) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
        toast({ title: "Notification marked as read." })
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    })
  }

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      const result = await markAllAsRead()
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
        toast({ title: `${result.count || 0} notifications marked as read.` })
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    })
  }

  const handleDeleteNotification = (id: string) => {
    startTransition(async () => {
      const result = await deleteNotificationAction(id)
      if (result.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        // Recalculate unread count, though the deleted one might have been read
        setUnreadCount((prev) => notifications.filter((n) => n.id !== id && !n.is_read).length)
        toast({ title: "Notification deleted." })
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 min-w-5 justify-center rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Open notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 md:w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && !isLoading && (
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto"
              onClick={handleMarkAllAsRead}
              disabled={isPending || unreadCount === 0}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading && notifications.length === 0 ? (
          <DropdownMenuItem disabled className="justify-center py-4">
            Loading notifications...
          </DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem disabled className="justify-center py-4">
            No new notifications
          </DropdownMenuItem>
        ) : (
          <ScrollArea className="h-[300px] md:h-[400px]">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 hover:bg-muted/50 data-[highlighted]:bg-muted/80",
                  !notification.is_read && "bg-primary/5 font-medium",
                )}
                onSelect={(e) => e.preventDefault()} // Prevent closing on item click
              >
                <div className="mt-1 shrink-0">{getNotificationIcon(notification.type)}</div>
                <div className="flex-grow">
                  <p className="text-sm font-semibold">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                  {notification.action_url && (
                    <Link href={notification.action_url} passHref legacyBehavior>
                      <a
                        className="text-xs text-blue-500 hover:underline mt-1 block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Details
                      </a>
                    </Link>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-1 shrink-0">
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsRead(notification.id)
                      }}
                      disabled={isPending}
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteNotification(notification.id)
                    }}
                    disabled={isPending}
                    title="Delete notification"
                  >
                    <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center" asChild>
          {/* TODO: Link to a dedicated notifications page */}
          <Link href="/dashboard/notifications" className="text-sm text-blue-500 hover:underline">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
