"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Wand2, Clock, Settings, CreditCard, LogOut, Zap, HelpCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { HelpDrawer } from "@/components/HelpDrawer"

const navItems = [
  { href: "/app", label: "Generate", icon: Wand2, exact: true },
  { href: "/app/history", label: "History", icon: Clock },
  { href: "/app/settings", label: "Settings", icon: Settings },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
]

interface UserStatus {
  subscriptionStatus: string
  freeUsed: number
}

interface AppSidebarProps {
  userEmail: string
}

export function AppSidebar({ userEmail }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    async function loadStatus() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("users")
        .select("subscription_status, free_generations_used")
        .eq("id", user.id)
        .single()

      if (data) {
        setUserStatus({
          subscriptionStatus: data.subscription_status ?? "free",
          freeUsed: data.free_generations_used ?? 0,
        })
      }
    }
    loadStatus()
  }, [pathname])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const isPro = userStatus?.subscriptionStatus === "active"
  const freeUsed = userStatus?.freeUsed ?? 0
  const freePercent = Math.min((freeUsed / 10) * 100, 100)

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <Link href="/app" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            Ombryth
          </span>
          {isPro && (
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
              PRO
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500")} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Free trial indicator */}
      {userStatus && !isPro && (
        <div className="px-4 pb-2">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Free trial</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{freeUsed}/10</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2.5">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  freeUsed >= 10 ? "bg-red-500" : freeUsed >= 7 ? "bg-amber-500" : "bg-blue-500"
                )}
                style={{ width: `${freePercent}%` }}
              />
            </div>
            {freeUsed >= 10 ? (
              <Link
                href="/app/billing"
                className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1.5 transition-colors w-full"
              >
                <Zap className="w-3 h-3" />
                Upgrade to Pro
              </Link>
            ) : (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
                {10 - freeUsed} generation{10 - freeUsed !== 1 ? "s" : ""} remaining
              </p>
            )}
          </div>
        </div>
      )}

      {/* User + Sign Out */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        <div className="px-3 py-1.5 mb-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{userEmail}</p>
          {isPro && (
            <p className="text-[11px] text-green-600 dark:text-green-400 font-medium mt-0.5">Pro · Unlimited</p>
          )}
        </div>
        <button
          onClick={() => setHelpOpen(true)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white transition-colors w-full text-left mb-1"
          title="Help & API Guides"
        >
          <HelpCircle className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          Help &amp; API Guides
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          Sign out
        </button>
      </div>
      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
    </aside>
  )
}
