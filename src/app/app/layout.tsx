import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/AppSidebar"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let userEmail = "preview@flowgen.app"
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) userEmail = user.email
  } catch { /* preview mode */ }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppSidebar userEmail={userEmail} />
      <main className="ml-60 min-h-screen p-6 lg:p-8">{children}</main>
    </div>
  )
}
