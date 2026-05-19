import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("users")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single()

  return NextResponse.json({ completed: data?.onboarding_completed ?? false })
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { error } = await supabase
    .from("users")
    .update({ onboarding_completed: true })
    .eq("id", user.id)

  if (error) return NextResponse.json({ error: "Failed to update onboarding" }, { status: 500 })

  return NextResponse.json({ success: true })
}
