import { createClient } from "@/lib/supabase/server"

export async function ensureReferralCode(userId: string): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("users")
    .select("referral_code")
    .eq("id", userId)
    .single()
  if (data?.referral_code) return data.referral_code
  const code = Math.random().toString(36).slice(2, 10)
  await supabase.from("users").update({ referral_code: code }).eq("id", userId)
  return code
}
