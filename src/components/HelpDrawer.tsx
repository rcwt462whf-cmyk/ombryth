"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface HelpDrawerProps {
  open: boolean
  onClose: () => void
}

type TabId = "openai" | "anthropic" | "gemini" | "replicate" | "stability" | "byteplus"

const tabs: { id: TabId; label: string }[] = [
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "gemini", label: "Google Gemini" },
  { id: "replicate", label: "Replicate" },
  { id: "stability", label: "Stability AI" },
  { id: "byteplus", label: "BytePlus" },
]

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline break-all"
    >
      {children}
    </a>
  )
}

function Section({ title, items }: { title: string; items: React.ReactNode[] }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-700">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function OpenAITab() {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">OpenAI</h3>
      <Section
        title="What it unlocks"
        items={[
          "DALL-E 3 for image generation",
          "GPT-4o for captions and vision analysis (product/style references)",
        ]}
      />
      <Section
        title="How to get your key"
        items={[
          <>Visit <ExternalLink href="https://platform.openai.com/api-keys">platform.openai.com/api-keys</ExternalLink></>,
          "Click \"Create new secret key\" and copy it (starts with sk-)",
        ]}
      />
      <Section
        title="Pricing"
        items={[
          "~$0.04 per DALL-E 3 image",
          "~$0.01 per caption generation",
          "New accounts get $5 free credit",
        ]}
      />
    </div>
  )
}

function AnthropicTab() {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Anthropic</h3>
      <Section
        title="What it unlocks"
        items={["Claude Sonnet for caption generation"]}
      />
      <Section
        title="How to get your key"
        items={[
          <>Visit <ExternalLink href="https://console.anthropic.com/settings/keys">console.anthropic.com/settings/keys</ExternalLink></>,
          "Click \"Create Key\" and copy the value",
        ]}
      />
      <Section
        title="Pricing"
        items={["~$0.003 per caption generation"]}
      />
    </div>
  )
}

function GeminiTab() {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Google Gemini</h3>
      <Section
        title="What it unlocks"
        items={["Gemini 1.5 Flash for captions — fast and very affordable"]}
      />
      <Section
        title="How to get your key"
        items={[
          <>Visit <ExternalLink href="https://aistudio.google.com/app/apikey">aistudio.google.com/app/apikey</ExternalLink></>,
          "Click \"Create API key\" and copy it",
        ]}
      />
      <Section
        title="Pricing"
        items={[
          "Free tier available",
          "After free tier: ~$0.00015 per caption",
        ]}
      />
    </div>
  )
}

function ReplicateTab() {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Replicate</h3>
      <Section
        title="What it unlocks"
        items={[
          "Flux Schnell — fast, low-cost image generation",
          "Flux Dev — img2img with style reference support",
        ]}
      />
      <Section
        title="How to get your key"
        items={[
          <>Visit <ExternalLink href="https://replicate.com/account/api-tokens">replicate.com/account/api-tokens</ExternalLink></>,
          "Click \"Create token\" and copy it",
        ]}
      />
      <Section
        title="Pricing"
        items={[
          "Flux Schnell: ~$0.003 per image",
          "Flux Dev: ~$0.025 per image",
        ]}
      />
    </div>
  )
}

function StabilityTab() {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Stability AI</h3>
      <Section
        title="What it unlocks"
        items={["Stable Diffusion 3 with native img2img support"]}
      />
      <Section
        title="How to get your key"
        items={[
          <>Visit <ExternalLink href="https://platform.stability.ai/account/keys">platform.stability.ai/account/keys</ExternalLink></>,
          "Click \"Create API Key\" and copy it",
        ]}
      />
      <Section
        title="Pricing"
        items={["~$0.065 per image for SD3"]}
      />
    </div>
  )
}

function BytePlusTab() {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">BytePlus (Seedream)</h3>
      <Section
        title="What it unlocks"
        items={["Seedream image generation"]}
      />
      <Section
        title="How to get your key"
        items={[
          <>Visit <ExternalLink href="https://console.byteplus.com">console.byteplus.com</ExternalLink></>,
          "Navigate to API Keys (requires a business account)",
        ]}
      />
      <div className="text-sm text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        Advanced — most users won&apos;t need this provider.
      </div>
    </div>
  )
}

const tabContent: Record<TabId, React.ReactNode> = {
  openai: <OpenAITab />,
  anthropic: <AnthropicTab />,
  gemini: <GeminiTab />,
  replicate: <ReplicateTab />,
  stability: <StabilityTab />,
  byteplus: <BytePlusTab />,
}

export function HelpDrawer({ open, onClose }: HelpDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("openai")

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-80 bg-background border-l border-border shadow-xl z-50 flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 className="font-semibold text-sm text-gray-900">Help &amp; API Guides</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close help drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab strip */}
        <div className="px-3 py-2 border-b border-border shrink-0 overflow-x-auto">
          <div className="flex gap-1.5 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {tabContent[activeTab]}
        </div>
      </div>
    </>
  )
}
