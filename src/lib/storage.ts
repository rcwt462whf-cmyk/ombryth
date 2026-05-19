import { createServiceClient } from "@/lib/supabase/server"

const BUCKET = "generated-images"

export async function uploadImageBuffer(
  buffer: Buffer,
  userId: string,
  ext: "jpg" | "png" = "jpg"
): Promise<string | null> {
  try {
    const supabase = await createServiceClient()
    const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: ext === "jpg" ? "image/jpeg" : "image/png",
        upsert: false,
      })

    if (error) {
      console.error("[storage] upload error:", error)
      return null
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
    return data.publicUrl
  } catch (err) {
    console.error("[storage] unexpected error:", err)
    return null
  }
}
