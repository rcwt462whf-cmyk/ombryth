/**
 * Pinterest Strategy Niches — CRUD API
 *
 * Requires this table in Supabase (run in SQL editor):
 *
 * create table pinterest_strategy_niches (
 *   id               uuid primary key default gen_random_uuid(),
 *   user_id          uuid references auth.users(id) on delete cascade not null,
 *   name             text not null,
 *   brand            text not null default 'general',
 *   color            text not null default '#3b82f6',
 *   keywords         text[] default '{}',
 *   posting_times    text default '',
 *   posting_frequency text default '',
 *   notes            text default '',
 *   created_at       timestamptz default now(),
 *   updated_at       timestamptz default now()
 * );
 * alter table pinterest_strategy_niches enable row level security;
 * create policy "Users manage own strategy niches"
 *   on pinterest_strategy_niches for all using (auth.uid() = user_id);
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("pinterest_strategy_niches")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ niches: [] })
  return NextResponse.json({ niches: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json() as {
    name: string
    brand: string
    color: string
    keywords: string[]
    posting_times: string
    posting_frequency: string
    notes: string
  }

  const { name, brand, color, keywords, posting_times, posting_frequency, notes } = body
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 })

  const { data, error } = await supabase
    .from("pinterest_strategy_niches")
    .insert({
      user_id: user.id,
      name: name.trim(),
      brand: brand || "general",
      color: color || "#3b82f6",
      keywords: keywords ?? [],
      posting_times: posting_times ?? "",
      posting_frequency: posting_frequency ?? "",
      notes: notes ?? "",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ niche: data })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json() as {
    id: string
    name?: string
    brand?: string
    color?: string
    keywords?: string[]
    posting_times?: string
    posting_frequency?: string
    notes?: string
  }

  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  const { error } = await supabase
    .from("pinterest_strategy_niches")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  const { error } = await supabase
    .from("pinterest_strategy_niches")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
