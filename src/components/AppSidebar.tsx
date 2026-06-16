"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Wand2, Clock, Settings, CreditCard, LogOut, Zap, HelpCircle, Menu, X, Target } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { HelpDrawer } from "@/components/HelpDrawer"
import { ThemeToggle } from "@/components/ThemeToggle"

const MINT = "#5fe6c4"
const ON_MINT = "#0b3b30"

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

function Wordmark() {
  return (
    <span className="font-display text-xl font-bold tracking-tight text-[#171717] dark:text-[#f2f2f2] flex items-center gap-2">
      Ombryth
      <span className="w-2 h-2 rounded-full" style={{ background: MINT }} />
    </span>
  )
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

  const proBadge = (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full tracking-wide" style={{ background: "#eafbf4", color: ON_MINT }}>
      PRO
    </span>
  )

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-[#ededed] dark:border-[#2e2e2e] flex items-center justify-between">
        <Link href="/app" className="flex items-center gap-2.5">
          <Wordmark />
          {isPro && proBadge}
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-md text-[#9a9a9a] hover:text-[#171717] dark:hover:text-white hover:bg-[#f4f4f4] dark:hover:bg-[#262626] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
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
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                isActive
                  ? "bg-[#eafbf4] dark:bg-[#5fe6c4]/10 text-[#0b3b30] dark:text-[#5fe6c4]"
                  : "text-[#707070] dark:text-[#a3a3a3] hover:bg-[#f4f4f4] dark:hover:bg-[#262626] hover:text-[#171717] dark:hover:text-white"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[#0b3b30] dark:text-[#5fe6c4]" : "text-[#9a9a9a] dark:text-[#6f6f6f]")} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Free trial indicator */}
      {userStatus && !isPro && (
        <div className="px-4 pb-2">
          <div className="bg-[#fafafa] dark:bg-[#262626] rounded-xl p-3 border border-[#ededed] dark:border-[#383838]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[#707070] dark:text-[#a3a3a3]">Free trial</span>
              <span className="text-xs text-[#9a9a9a] dark:text-[#6f6f6f] tabular-nums">{freeUsed}/10</span>
            </div>
            <div className="w-full bg-[#ededed] dark:bg-[#383838] rounded-full h-1.5 mb-2.5">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  freeUsed >= 10 ? "bg-red-500" : freeUsed >= 7 ? "bg-amber-500" : ""
                )}
                style={freeUsed < 7 ? { width: `${freePercent}%`, background: MINT } : { width: `${freePercent}%` }}
              />
            </div>
            {freeUsed >= 10 ? (
              <Link
                href="/app/billing"
                className="flex items-center justify-center gap-1.5 text-xs font-medium rounded-md px-3 py-1.5 transition-colors w-full"
                style={{ background: MINT, color: ON_MINT }}
              >
                <Zap className="w-3 h-3" />
                Upgrade to Pro
              </Link>
            ) : (
              <p className="text-[11px] text-[#9a9a9a] dark:text-[#6f6f6f] text-center">
                {10 - freeUsed} generation{10 - freeUsed !== 1 ? "s" : ""} remaining
              </p>
            )}
          </div>
        </div>
      )}

      {/* User + Sign Out */}
      <div className="p-3 border-t border-[#ededed] dark:border-[#2e2e2e]">
        <div className="px-3 py-1.5 mb-1">
          <p className="text-xs font-medium text-[#707070] dark:text-[#a3a3a3] truncate">{userEmail}</p>
          {isPro && (
            <p className="text-[11px] font-medium mt-0.5" style={{ color: ON_MINT }}>Pro · Unlimited</p>
          )}
        </div>
        <button
          onClick={() => setHelpOpen(true)}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#707070] dark:text-[#a3a3a3] hover:bg-[#f4f4f4] dark:hover:bg-[#262626] hover:text-[#171717] dark:hover:text-white transition-all w-full text-left mb-0.5"
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          Help &amp; API Guides
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#707070] dark:text-[#a3a3a3] hover:bg-[#f4f4f4] dark:hover:bg-[#262626] hover:text-[#171717] dark:hover:text-white transition-all w-full text-left"
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
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 bg-white dark:bg-[#181818] border-r border-[#ededed] dark:border-[#2e2e2e] flex-col z-30">
        {sidebarContent}
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#181818] border-b border-[#ededed] dark:border-[#2e2e2e]">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-md text-[#707070] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-white hover:bg-[#f4f4f4] dark:hover:bg-[#262626] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/app" className="flex items-center gap-2">
          <Wordmark />
          {isPro && proBadge}
        </Link>
      </div>

      {/* ── Mobile drawer + backdrop ─────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="lg:hidden fixed left-0 top-0 h-screen w-72 max-w-[85vw] bg-white dark:bg-[#181818] border-r border-[#ededed] dark:border-[#2e2e2e] flex flex-col z-50">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
