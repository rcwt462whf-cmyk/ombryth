import Link from "next/link"

export default function TermsPage() {
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

        <h1 className="text-4xl font-bold text-gray-900 mb-3">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-12">Last updated: May 2026</p>

        <div className="space-y-10 text-gray-700 leading-relaxed">

          {/* 1. Acceptance */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of terms</h2>
            <p>
              By creating an account or using FlowGen in any way, you agree to be bound by these Terms of Service.
              If you do not agree, do not use the service. These terms form a binding agreement between you and
              FlowGen, operated by an individual developer based in Hungary, EU.
            </p>
          </section>

          {/* 2. The service */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. What FlowGen is</h2>
            <p>
              FlowGen is a tool that provides a user interface for generating AI images and platform-ready captions
              (Pinterest titles, Instagram captions, blog copy) using AI models you choose. FlowGen connects to
              third-party AI providers using API keys you supply. We are a tool, not an AI provider — we do not
              supply, resell, or take responsibility for the underlying AI models or their outputs.
            </p>
          </section>

          {/* 3. API keys */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Your API keys</h2>
            <p className="mb-3">
              To use FlowGen&apos;s AI features, you must provide valid API keys from your chosen AI providers (e.g. OpenAI,
              Anthropic, Google, Replicate, Stability AI, BytePlus). By adding your API keys to FlowGen:
            </p>
            <ul className="space-y-2 list-disc list-inside text-gray-600">
              <li>You confirm the keys belong to you or that you are authorised to use them.</li>
              <li>You accept full responsibility for any costs incurred at the third-party provider as a result of FlowGen making requests with your keys.</li>
              <li>You must not add keys belonging to other people without their explicit permission.</li>
            </ul>
            <p className="mt-3">
              FlowGen stores your keys encrypted with AES-256 and uses them only to fulfil generation requests you initiate.
              We will not use your keys for any other purpose.
            </p>
          </section>

          {/* 4. Subscription & billing */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Subscription and billing</h2>
            <ul className="space-y-3 list-none">
              <li>
                <strong className="text-gray-900">Free tier.</strong> New accounts receive 10 free generations. No credit card is required to start.
              </li>
              <li>
                <strong className="text-gray-900">Pro subscription.</strong> Unlimited generations are available for €2.99/month, billed monthly via Stripe.
              </li>
              <li>
                <strong className="text-gray-900">Cancellation.</strong> You may cancel your subscription at any time via <strong>Settings → Billing</strong>.
                Your Pro access continues until the end of the current billing period.
              </li>
              <li>
                <strong className="text-gray-900">Refunds.</strong> We do not offer refunds for partial months or unused generations.
              </li>
              <li>
                <strong className="text-gray-900">Payment processing.</strong> All payments are processed by Stripe. FlowGen never sees your
                card number or other payment card data.
              </li>
            </ul>
          </section>

          {/* 5. Acceptable use */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Acceptable use</h2>
            <p className="mb-3">You agree not to use FlowGen to:</p>
            <ul className="space-y-2 list-disc list-inside text-gray-600">
              <li>Generate content that is illegal under applicable law, including content that exploits minors.</li>
              <li>Infringe the intellectual property rights of third parties.</li>
              <li>Violate the terms of service of any AI provider whose API you connect to FlowGen.</li>
              <li>Attempt to reverse-engineer, scrape, or interfere with the operation of the service.</li>
              <li>Use the service for spam, harassment, or deceptive practices.</li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these rules, without prior notice.
            </p>
          </section>

          {/* 6. Generated content */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Ownership of generated content</h2>
            <p>
              You own the images and captions you generate through FlowGen, subject to the terms of the underlying AI provider
              (e.g. OpenAI&apos;s usage policy). FlowGen claims no ownership over, and takes no licence to, your generated outputs.
              You are responsible for ensuring your use of generated content complies with the relevant provider&apos;s terms
              and applicable law.
            </p>
          </section>

          {/* 7. Uploaded content */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Ownership of uploaded content</h2>
            <p>
              You retain full ownership of any images you upload to FlowGen (style references, product photos, etc.).
              By uploading content, you grant FlowGen a limited, non-exclusive licence to store and process that content
              for the sole purpose of fulfilling your generation requests. This licence ends when you delete the content
              or your account.
            </p>
          </section>

          {/* 8. Disclaimer of warranties */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Disclaimer of warranties</h2>
            <p>
              FlowGen is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied.
              We do not guarantee uninterrupted uptime, the accuracy or quality of AI-generated outputs, or that the service
              will meet your specific requirements. AI models can produce unexpected, inaccurate, or inappropriate results —
              you use them at your own discretion.
            </p>
          </section>

          {/* 9. Limitation of liability */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, FlowGen&apos;s total liability to you for any claim arising from your use of
              the service is limited to the total amount you paid to FlowGen in the three (3) months immediately preceding
              the claim. FlowGen is not liable for any indirect, incidental, special, or consequential damages, including
              loss of revenue, loss of data, or damage to your reputation, even if advised of the possibility of such damages.
            </p>
          </section>

          {/* 10. Termination */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Termination</h2>
            <p>
              You may cancel and delete your account at any time via <strong>Settings → Account</strong>.
              We may suspend or terminate your account at our discretion if you violate these Terms. Upon termination,
              your access to the service ends immediately. Provisions that by their nature should survive termination
              (including sections on liability and governing law) will do so.
            </p>
          </section>

          {/* 11. Governing law */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Governing law</h2>
            <p>
              These Terms are governed by the laws of Hungary and, where applicable, European Union law. Any disputes
              arising from or relating to these Terms or your use of FlowGen shall be resolved in the competent courts
              of Hungary.
            </p>
          </section>

          {/* 12. Changes */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to these terms</h2>
            <p>
              We may update these Terms of Service from time to time. When we do, we will update the &ldquo;Last updated&rdquo; date
              at the top of this page. Your continued use of FlowGen after any changes constitutes your acceptance of the
              revised terms.
            </p>
          </section>

          {/* 13. Contact */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact</h2>
            <p>
              Questions about these Terms? Contact us at{" "}
              <a href="mailto:contact@yourdomain.com" className="text-blue-600 hover:underline">contact@yourdomain.com</a>.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
          FlowGen &middot;{" "}
          <a href="mailto:contact@yourdomain.com" className="hover:text-gray-600 transition-colors">contact@yourdomain.com</a>
          {" "}&middot; Hungary, EU
        </div>
      </div>
    </div>
  )
}
