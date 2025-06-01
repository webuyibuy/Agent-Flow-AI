"use client"

import type React from "react"

import { Home, Bot, GitBranch, BarChart3, Bell, Settings, Zap } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { usePathname } from "next/navigation"

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Agents", href: "/dashboard/agents/manage", icon: Bot },
  { name: "Dependencies", href: "/dashboard/dependencies", icon: GitBranch },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Test LLM", href: "/test-llm", icon: Zap },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" className="md:hidden">
            Menu
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:w-64 p-0">
          <SheetHeader className="pl-6 pr-8">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Manage your account preferences and set e-mail preferences.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-100px)]">
            <div className="py-4">
              <div className="px-6">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
                <div className="space-y-0.5 mt-2">
                  <p className="text-sm font-medium text-muted-foreground">shadcn@example.com</p>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  return (
                    <DashboardNavLink key={item.href} href={item.href} icon={item.icon}>
                      {item.name}
                    </DashboardNavLink>
                  )
                })}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
      <div className="hidden md:flex flex-col w-64 border-r h-screen">
        <ScrollArea className="h-full">
          <div className="py-4">
            <div className="px-6">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
              <div className="space-y-0.5 mt-2">
                <p className="text-sm font-medium text-muted-foreground">shadcn@example.com</p>
              </div>
            </div>
            <Separator className="my-2" />
            <div className="space-y-1">
              {navigationItems.map((item) => {
                return (
                  <DashboardNavLink key={item.href} href={item.href} icon={item.icon}>
                    {item.name}
                  </DashboardNavLink>
                )
              })}
            </div>
          </div>
        </ScrollArea>
      </div>
      <div className="flex-1 p-4">{children}</div>
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Open user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Link href="/profile">Edit Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/logout">Logout</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function DashboardNavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string
  icon: any
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`flex items-center space-x-2 rounded-md p-2 text-sm font-medium hover:underline ${
        isActive ? "text-blue-600" : "text-gray-600"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Link>
  )
}
