import { createClient } from "@supabase/supabase-js"
import { RefCookieSetter } from "./RefCookieSetter"
import { CheckCircle2, Zap, Users, TrendingUp } from "lucide-react"

interface PageProps {
  params: { code: string }
}

export default async function ReferralPage({ params }: PageProps) {
  const { code } = params

  // Use service role for this public lookup (no auth context available)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: referrer } = await supabase
    .from("users")
    .select("id, email")
    .eq("referral_code", code)
    .single()

  if (!referrer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔗</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid referral link</h1>
          <p className="text-gray-500 text-sm mb-6">
            This referral link is not valid or has expired.
          </p>
          <a
            href="https://ombryth.io"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Visit Ombryth
          </a>
        </div>
      </div>
    )
  }

  return (
    <>
      <RefCookieSetter code={code} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Users className="w-3.5 h-3.5" />
              Your friend invited you
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Join Ombryth and grow your affiliate business
            </h1>
            <p className="text-gray-500 text-base">
              AI-powered content generation built for affiliate marketers. Create stunning product images and captions in seconds.
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 space-y-4">
            {[
              {
                icon: Zap,
                title: "Generate content instantly",
                desc: "AI images, Instagram captions, Pinterest descriptions & blog posts — all in one click.",
              },
              {
                icon: TrendingUp,
                title: "Built for affiliate marketers",
                desc: "Presets for home decor, lifestyle, beauty and more. Speak to your audience in the right tone.",
              },
              {
                icon: CheckCircle2,
                title: "All the top AI models",
                desc: "DALL-E 3, Flux, Stable Diffusion, GPT-4o, Claude, Gemini — bring your own API keys.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center space-y-3">
            <a
              href={`/signup?ref=${encodeURIComponent(code)}`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm shadow-md shadow-blue-200"
            >
              Get started free
            </a>
            <p className="text-xs text-gray-400">
              When you subscribe, your friend gets a free month on us. No credit card required to sign up.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
