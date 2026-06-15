import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Zap, CheckCircle2 } from "lucide-react"
import { UpgradeButton } from "@/components/UpgradeButton"

export default async function BillingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase
    .from("users")
    .select("subscription_status, free_generations_used, stripe_customer_id")
    .eq("id", user.id)
    .single()

  const isPro = userData?.subscription_status === "active"
  const freeUsed = userData?.free_generations_used ?? 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-gray-900 dark:text-white">Billing</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage your subscription</p>
      </div>

      {/* Current plan card */}
      <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-white/[0.07] p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Current plan</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              {isPro ? "You have unlimited access" : `${freeUsed}/10 free generations used`}
            </p>
          </div>
          <Badge variant={isPro ? "default" : "secondary"} className="capitalize">
            {isPro ? "Pro" : "Free"}
          </Badge>
        </div>

        {isPro ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-700 font-medium">
                Active subscription — €2.99/month
              </p>
            </div>
            <ul className="space-y-2">
              {[
                "Unlimited generations",
                "All AI image models",
                "All AI text models",
                "Batch mode (3 variations)",
                "Pinterest, Instagram & Blog content",
                "Automatic metadata stripping",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="pt-2 border-t border-gray-100">
              <form action="/api/stripe/portal" method="POST">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  <CreditCard className="w-4 h-4" />
                  Manage subscription
                </button>
              </form>
              <p className="text-xs text-gray-400 mt-2">
                Cancel anytime — access continues until the end of your billing period.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Free progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Free generations</span>
                <span>{freeUsed}/10 used</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((freeUsed / 10) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Upgrade card */}
            <div className="bg-gradient-to-b from-indigo-700 to-blue-800 rounded-xl p-5 text-white shadow-[0_8px_32px_rgba(99,102,241,0.2)] relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/[0.05] rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-2 relative">
                <Zap className="w-5 h-5 text-indigo-200" />
                <span className="font-semibold">Upgrade to Pro</span>
              </div>
              <p className="text-indigo-200 text-sm mb-4 relative">
                Unlimited generations, all models, batch mode — for just €2.99/month.
              </p>
              <ul className="space-y-1.5 mb-5">
                {[
                  "Unlimited generations",
                  "Batch mode (3 variations)",
                  "Priority support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/90 relative">
                    <CheckCircle2 className="w-4 h-4 text-indigo-200 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <UpgradeButton />
            </div>

            <p className="text-xs text-gray-400 text-center">
              Cancel anytime · No hidden fees · Your API keys, your costs
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
