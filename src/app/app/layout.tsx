import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/AppSidebar"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let userEmail = "preview@ombryth.io"
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) userEmail = user.email
  } catch { /* preview mode */ }

  return (
    <div className="min-h-screen bg-[#f5f5f4] dark:bg-[#141414] bg-dot-grid">
      <AppSidebar userEmail={userEmail} />
      {/* pt-16 on mobile = room for the fixed top bar; lg:ml-60 = desktop sidebar */}
      <main className="pt-16 lg:pt-0 lg:ml-60 min-h-screen p-4 lg:p-8 xl:p-10">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
