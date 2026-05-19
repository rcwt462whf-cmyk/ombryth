import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/ThemeProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://ombryth.io"),
  title: "Ombryth — AI lifestyle images + social captions",
  description:
    "Bring your own AI keys. Generate scroll-stopping Pinterest, Instagram, Facebook and Google Ads content for your products in one click.",
  openGraph: {
    title: "Ombryth — AI lifestyle images + social captions",
    description:
      "Bring your own AI keys. Generate scroll-stopping Pinterest, Instagram, Facebook and Google Ads content — in one click.",
    url: "https://ombryth.io",
    siteName: "Ombryth",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ombryth — AI lifestyle images + social captions",
    description:
      "Bring your own AI keys. Generate scroll-stopping content in one click.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
