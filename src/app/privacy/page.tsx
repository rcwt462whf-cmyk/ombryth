import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to home
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-12">Last updated: May 2026</p>

        <div className="space-y-10 text-gray-700 leading-relaxed">

          {/* 1. Who we are */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Who we are</h2>
            <p>
              Ombryth is an AI image and caption generation tool operated by an individual developer based in Hungary, European Union.
              If you have any questions about this policy or your data, please contact us at{" "}
              <a href="mailto:hello@ombryth.com" className="text-blue-600 hover:underline">hello@ombryth.com</a>.
            </p>
          </section>

          {/* 2. What data we collect */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. What data we collect</h2>
            <p className="mb-4">We collect only what is necessary to provide the service:</p>
            <ul className="space-y-4 list-none">
              <li>
                <strong className="text-gray-900">Account information.</strong> Your email address and a password hash.
                Authentication is handled by Supabase Auth — we never store your password in plaintext.
              </li>
              <li>
                <strong className="text-gray-900">API keys.</strong> The AI provider API keys you choose to add (e.g. OpenAI, Anthropic, Google,
                Replicate, Stability AI, BytePlus). These are encrypted with AES-256 before being stored in our database.
                They are never transmitted in plaintext, never logged, and are used solely to make generation requests on your behalf.
              </li>
              <li>
                <strong className="text-gray-900">Uploaded images.</strong> Style reference images and product photos you upload to start a generation.
                These are processed server-side and stored in Supabase Storage under your account.
              </li>
              <li>
                <strong className="text-gray-900">Generated images.</strong> Images produced by AI models are stored in Supabase Storage
                and associated with your account. They are accessible via URL.
              </li>
              <li>
                <strong className="text-gray-900">Billing information.</strong> Payments are handled entirely by Stripe.
                We store only your Stripe Customer ID so we can manage your subscription — we never see or store your card number,
                CVV, or other payment card data.
              </li>
              <li>
                <strong className="text-gray-900">Usage data.</strong> We track the number of generations you have used
                so we can enforce the free tier limit of 10 generations.
              </li>
            </ul>
          </section>

          {/* 3. What we do NOT collect */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. What we do not collect</h2>
            <p className="mb-3">We have made a deliberate choice to keep Ombryth free of surveillance infrastructure:</p>
            <ul className="space-y-2 list-disc list-inside text-gray-600">
              <li>No analytics or tracking pixels of any kind</li>
              <li>No advertising networks or retargeting</li>
              <li>No location data or IP logging beyond what Supabase and your hosting infrastructure record at the network level</li>
              <li>No device fingerprinting</li>
              <li>No sale or sharing of your data with third parties for marketing purposes</li>
            </ul>
          </section>

          {/* 4. Third-party services */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Third-party services we use</h2>
            <p className="mb-4">Ombryth relies on a small number of trusted third-party services to operate:</p>
            <ul className="space-y-3 list-none">
              <li>
                <strong className="text-gray-900">Supabase</strong> — provides authentication, the PostgreSQL database where your account and
                encrypted API keys are stored, and the file storage for your uploaded and generated images.
                Supabase is configured in an EU region.
              </li>
              <li>
                <strong className="text-gray-900">Stripe</strong> — handles all subscription billing. When you subscribe,
                you interact with Stripe&apos;s payment interface directly. Stripe&apos;s privacy policy applies to data you share with them.
              </li>
              <li>
                <strong className="text-gray-900">AI providers you connect</strong> — when you initiate a generation, your API key and the
                relevant image/text inputs are sent to the AI provider you have selected (e.g. OpenAI, Anthropic, Google, Replicate,
                Stability AI, BytePlus). Each provider&apos;s own privacy policy governs how they handle those requests.
                We do not pay for or resell AI credits — your key, your costs.
              </li>
            </ul>
          </section>

          {/* 5. Data retention */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data retention</h2>
            <ul className="space-y-2 list-disc list-inside text-gray-600">
              <li>Account data (email, encrypted API keys) is kept until you delete your account.</li>
              <li>Uploaded and generated images are kept until you delete them from your account.</li>
              <li>
                Billing records (Stripe Customer ID and transaction history) are retained for 7 years as required by EU accounting law.
              </li>
            </ul>
          </section>

          {/* 6. Your rights (GDPR) */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your rights under GDPR</h2>
            <p className="mb-3">
              As a user based in the EU (or interacting with an EU-based operator), you have the following rights regarding your personal data:
            </p>
            <ul className="space-y-2 list-disc list-inside text-gray-600">
              <li><strong className="text-gray-900">Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong className="text-gray-900">Rectification</strong> — ask us to correct inaccurate data.</li>
              <li><strong className="text-gray-900">Erasure</strong> — request deletion of your account and all associated data.</li>
              <li><strong className="text-gray-900">Portability</strong> — request your data in a machine-readable format.</li>
            </ul>
            <p className="mt-4">
              You can delete your account at any time via <strong>Settings → Account</strong>. For other data requests, contact us at{" "}
              <a href="mailto:hello@ombryth.com" className="text-blue-600 hover:underline">hello@ombryth.com</a>.
            </p>
          </section>

          {/* 7. Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies</h2>
            <p>
              Ombryth sets a single session cookie used by Supabase Auth to keep you logged in. This cookie is strictly necessary
              for the service to function and does not track you across other websites. We do not use advertising cookies,
              analytics cookies, or any other tracking cookies.
            </p>
          </section>

          {/* 8. Security */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Security</h2>
            <p className="mb-3">We take reasonable technical measures to protect your data:</p>
            <ul className="space-y-2 list-disc list-inside text-gray-600">
              <li>All API keys are encrypted at rest using AES-256 before storage.</li>
              <li>All data in transit is encrypted via HTTPS/TLS.</li>
              <li>Database access is protected by Supabase Row-Level Security (RLS) — your data is only accessible by your account.</li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">
              No system is completely secure. If you discover a security issue, please contact us immediately at{" "}
              <a href="mailto:hello@ombryth.com" className="text-blue-600 hover:underline">hello@ombryth.com</a>.
            </p>
          </section>

          {/* 9. Changes */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the &ldquo;Last updated&rdquo; date at the top of
              this page. Your continued use of Ombryth after any changes constitutes your acceptance of the revised policy.
            </p>
          </section>

          {/* 10. Contact */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact</h2>
            <p>
              Questions about this Privacy Policy or your data? Email us at{" "}
              <a href="mailto:hello@ombryth.com" className="text-blue-600 hover:underline">hello@ombryth.com</a>.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
          Ombryth &middot;{" "}
          <a href="mailto:hello@ombryth.com" className="hover:text-gray-600 transition-colors">hello@ombryth.com</a>
          {" "}&middot; Hungary, EU
        </div>
      </div>
    </div>
  )
}
