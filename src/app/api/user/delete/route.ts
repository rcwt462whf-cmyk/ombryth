import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Delete all files from storage bucket under user's folder
    const { data: files } = await supabase.storage
      .from("generated-images")
      .list(user.id)

    if (files && files.length > 0) {
      const paths = files.map((f) => `${user.id}/${f.name}`)
      await supabase.storage.from("generated-images").remove(paths)
    }

    // 2. Delete from generations table
    const { error: genError } = await supabase
      .from("generations")
      .delete()
      .eq("user_id", user.id)
    if (genError) throw new Error(genError.message)

    // 3. Delete from saved_prompts table
    const { error: promptsError } = await supabase
      .from("saved_prompts")
      .delete()
      .eq("user_id", user.id)
    if (promptsError) throw new Error(promptsError.message)

    // 4. Delete from api_keys table
    const { error: keysError } = await supabase
      .from("api_keys")
      .delete()
      .eq("user_id", user.id)
    if (keysError) throw new Error(keysError.message)

    // 5. Delete from users table
    const { error: userError } = await supabase
      .from("users")
      .delete()
      .eq("id", user.id)
    if (userError) throw new Error(userError.message)

    // 6. Delete the auth user using service role client
    const serviceClient = await createServiceClient()
    const { error: deleteAuthError } = await serviceClient.auth.admin.deleteUser(user.id)
    if (deleteAuthError) throw new Error(deleteAuthError.message)

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
