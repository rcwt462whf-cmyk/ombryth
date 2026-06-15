"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Wand2, Clock, Settings, CreditCard, LogOut, Zap, HelpCircle, Menu, X, Target } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { HelpDrawer } from "@/components/HelpDrawer"

const navItems = [
  { href: "/app",          label: "Generate", icon: Wand2,   exact: true },
  { href: "/app/strategy", label: "Keywords", icon: Target },
  { href: "/app/history",  label: "History",  icon: Clock },
  { href: "/app/settings", label: "Settings", icon: Settings },
  { href: "/app/billing",  label: "Billing",  icon: CreditCard },
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
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

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

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center justify-between">
        <Link href="/app" className="flex items-center gap-2.5">
          <span className="font-display text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Ombryth
          </span>
          {isPro && (
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-1.5 py-0.5 rounded-full tracking-wide">
              PRO
            </span>
          )}
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
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
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-[inset_2px_0_0_0] shadow-indigo-500 dark:shadow-indigo-500"
                  : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-slate-500")} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Free trial indicator */}
      {userStatus && !isPro && (
        <div className="px-4 pb-2">
          <div className="bg-gray-50 dark:bg-white/[0.04] rounded-xl p-3 border border-gray-100 dark:border-white/[0.07]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-600 dark:text-slate-400">Free trial</span>
              <span className="text-xs text-gray-400 dark:text-slate-600 tabular-nums">{freeUsed}/10</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-white/[0.08] rounded-full h-1.5 mb-2.5">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  freeUsed >= 10 ? "bg-red-500" : freeUsed >= 7 ? "bg-amber-500" : "bg-indigo-500"
                )}
                style={{ width: `${freePercent}%` }}
              />
            </div>
            {freeUsed >= 10 ? (
              <Link
                href="/app/billing"
                className="flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg px-3 py-1.5 transition-colors w-full shadow-md shadow-indigo-600/20"
              >
                <Zap className="w-3 h-3" />
                Upgrade to Pro
              </Link>
            ) : (
              <p className="text-[11px] text-gray-400 dark:text-slate-600 text-center">
                {10 - freeUsed} generation{10 - freeUsed !== 1 ? "s" : ""} remaining
              </p>
            )}
          </div>
        </div>
      )}

      {/* User + Sign Out */}
      <div className="p-3 border-t border-gray-100 dark:border-white/[0.07]">
        <div className="px-3 py-1.5 mb-1">
          <p className="text-xs font-medium text-gray-500 dark:text-slate-500 truncate">{userEmail}</p>
          {isPro && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Pro · Unlimited</p>
          )}
        </div>
        <button
          onClick={() => setHelpOpen(true)}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-white/[0.05] hover:text-gray-700 dark:hover:text-white transition-all w-full text-left mb-0.5"
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          Help &amp; API Guides
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-white/[0.05] hover:text-gray-700 dark:hover:text-white transition-all w-full text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  )

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 bg-white dark:bg-[#08090f] border-r border-gray-100 dark:border-white/[0.07] flex-col z-30">
        {sidebarContent}
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#08090f] border-b border-gray-100 dark:border-white/[0.07]">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/app" className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
            Ombryth
          </span>
          {isPro && (
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-1.5 py-0.5 rounded-full">
              PRO
            </span>
          )}
        </Link>
      </div>

      {/* ── Mobile drawer + backdrop ─────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="lg:hidden fixed left-0 top-0 h-screen w-72 max-w-[85vw] bg-white dark:bg-[#08090f] border-r border-gray-100 dark:border-white/[0.07] flex flex-col z-50">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
