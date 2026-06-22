"use client"

import { useState } from "react"
import { Copy, Check, Users, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReferralCardProps {
  referralCode: string
  freeMonths: number
  referralCount: number
}

export function ReferralCard({ referralCode, freeMonths, referralCount }: ReferralCardProps) {
  const [copied, setCopied] = useState(false)

  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://ombryth.com"}/ref/${referralCode}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      try {
        const el = document.createElement("textarea")
        el.value = referralLink
        document.body.appendChild(el)
        el.select()
        document.execCommand("copy")
        document.body.removeChild(el)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // Silent fail
      }
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Gift className="w-4 h-4 text-muted-foreground" /> Referral Program
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Earn 1 free month for every paying subscriber you refer.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Referrals</span>
          </div>
          <p className="text-xl font-bold text-foreground tabular-nums">{referralCount}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Gift className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Free months</span>
          </div>
          <p className="text-xl font-bold text-foreground tabular-nums">{freeMonths}</p>
        </div>
      </div>

      {/* Referral link */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Your referral link</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 overflow-hidden">
            <p className="text-xs font-mono text-foreground truncate">{referralLink}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={copyLink}
            className="shrink-0 gap-1.5 h-auto py-2"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-xs">Copy link</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
