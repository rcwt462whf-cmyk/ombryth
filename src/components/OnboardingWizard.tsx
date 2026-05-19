"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface OnboardingWizardProps {
  userId: string
  onComplete: () => void
}

export default function OnboardingWizard({ userId: _userId, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [loaded, setLoaded] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  useEffect(() => {
    fetch("/api/user/onboarding")
      .then((r) => r.json())
      .then((d) => {
        if (d.completed) {
          onComplete()
        } else {
          setLoaded(true)
        }
      })
      .catch(() => setLoaded(true))
  }, [onComplete])

  async function complete() {
    setDismissing(true)
    try {
      await fetch("/api/user/onboarding", { method: "POST" })
    } catch {
      // ignore
    }
    onComplete()
  }

  if (!loaded) return null

  const totalSteps = 4

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300"
      style={{ opacity: dismissing ? 0 : 1 }}
    >
      <div className="relative bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full mx-4 transition-transform duration-300">
        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-6">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i + 1 <= step
                  ? "bg-blue-500 flex-1"
                  : "bg-gray-200 w-8"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Welcome to Ombryth 🎉</h2>
            <p className="text-gray-600 leading-relaxed">
              You generate lifestyle images + platform-ready captions in one click. You bring your
              own AI API keys — we never mark them up or resell AI credits. Let&apos;s get your first
              key set up. It takes 2 minutes.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">What&apos;s an API key?</h2>
            <p className="text-gray-600 leading-relaxed">
              An API key is like a password that lets Ombryth talk to AI services (OpenAI, etc.) on
              your behalf. You pay those services directly at their published rates — typically
              fractions of a cent per generation. Your keys are AES-256 encrypted in our database
              and never logged.
            </p>

            {/* Flow diagram */}
            <div className="flex items-center gap-2 mt-4">
              <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">🧑</div>
                <div className="text-sm font-semibold text-blue-900">You</div>
                <div className="text-xs text-blue-600 mt-0.5">Subscribe to Ombryth</div>
              </div>
              <div className="text-gray-400 text-lg font-bold shrink-0">→</div>
              <div className="flex-1 bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">⚡</div>
                <div className="text-sm font-semibold text-purple-900">Ombryth</div>
                <div className="text-xs text-purple-600 mt-0.5">Routes your request</div>
              </div>
              <div className="text-gray-400 text-lg font-bold shrink-0">→</div>
              <div className="flex-1 bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">🤖</div>
                <div className="text-sm font-semibold text-green-900">OpenAI</div>
                <div className="text-xs text-green-600 mt-0.5">Billed at cost</div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Get your OpenAI API key</h2>

            <ol className="space-y-3 text-gray-600">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                <span>
                  Go to{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    platform.openai.com/api-keys
                  </a>{" "}
                  — sign up free if you don&apos;t have an account
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                <span>
                  Click <strong>&ldquo;Create new secret key&rdquo;</strong> — name it &ldquo;Ombryth&rdquo;
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                <span>
                  Copy the key (starts with <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">sk-</code>) — you can only see it once
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">4</span>
                <span>
                  Come back here and paste it in <strong>Settings → API Keys</strong>
                </span>
              </li>
            </ol>

            <p className="text-sm text-gray-500 leading-relaxed">
              OpenAI covers DALL-E 3 (images) + GPT-4o (captions + vision). That&apos;s all you need to
              start — other providers like Replicate or Stability AI are optional and unlock
              additional image models.
            </p>

            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-sm text-amber-800">
                💡 New OpenAI accounts get $5 free credit — enough for hundreds of generations.
              </p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">You&apos;re all set! 🚀</h2>
            <p className="text-gray-600 leading-relaxed">
              Paste your key in <strong>Settings → API Keys</strong>, then come back to Generate and
              hit the button. If you get stuck, hit the ? button in the sidebar for per-provider
              guides.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <div>
            {step > 1 && step < 4 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
                className="text-gray-500"
              >
                ← Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < 4 && (
              <button
                onClick={complete}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip for now
              </button>
            )}

            {step < 4 ? (
              <Button onClick={() => setStep((s) => s + 1)}>
                {step === 1 ? "Let's go →" : step === 2 ? "Got it →" : "I have my key →"}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={complete}>
                  Start generating
                </Button>
                <Button asChild>
                  <a href="/app/settings" onClick={() => { void fetch("/api/user/onboarding", { method: "POST" }) }}>
                    Go to Settings →
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
