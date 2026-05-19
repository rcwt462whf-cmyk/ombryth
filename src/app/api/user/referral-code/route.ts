import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ensureReferralCode } from "@/lib/ensure-referral-code"

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const referral_code = await ensureReferralCode(user.id)
  return NextResponse.json({ referral_code })
}
