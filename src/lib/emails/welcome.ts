import { resend } from "@/lib/resend"

const APP_URL = "https://ombryth.com"

function buildWelcomeHtml(referralCode?: string): string {
  const referralSection = referralCode
    ? `
    <tr>
      <td style="padding: 24px 0; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #111827;">
          Refer a friend, get a free month
        </p>
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">
          Share Ombryth and earn a free month for every paying friend you bring in.
        </p>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          Your referral link:&nbsp;
          <a href="${APP_URL}/ref/${referralCode}"
             style="color: #0b9c75; text-decoration: none; word-break: break-all;">
            ${APP_URL}/ref/${referralCode}
          </a>
        </p>
      </td>
    </tr>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Ombryth</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
         style="background-color: #f9fafb; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
               style="max-width: 560px; background-color: #ffffff; border-radius: 12px;
                      box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background-color: #5fe6c4;
                        padding: 40px 40px 36px 40px; text-align: center;">
              <p style="margin: 0; font-size: 22px; font-weight: 700; color: #0b3b30;
                         letter-spacing: -0.3px;">
                Ombryth
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 40px 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">

                <!-- Heading -->
                <tr>
                  <td style="padding-bottom: 16px;">
                    <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #111827;
                                letter-spacing: -0.5px; line-height: 1.2;">
                      Welcome to Ombryth! 🎉
                    </h1>
                  </td>
                </tr>

                <!-- Intro -->
                <tr>
                  <td style="padding-bottom: 32px;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #374151;">
                      You're all set. Here's how to generate your first lifestyle image in 60 seconds.
                    </p>
                  </td>
                </tr>

                <!-- Steps -->
                <tr>
                  <td style="padding-bottom: 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">

                      <!-- Step 1 -->
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td valign="top" width="36"
                                  style="padding-top: 1px;">
                                <div style="width: 28px; height: 28px; background-color: #eafbf4;
                                            border-radius: 50%; text-align: center; line-height: 28px;
                                            font-size: 13px; font-weight: 700; color: #0b3b30;">
                                  1
                                </div>
                              </td>
                              <td>
                                <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">
                                  <strong style="color: #111827;">Add your OpenAI key</strong><br />
                                  Go to <strong>Settings → API Keys</strong> and paste your OpenAI API key.
                                  It's used for image generation and caption writing.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Step 2 -->
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td valign="top" width="36"
                                  style="padding-top: 1px;">
                                <div style="width: 28px; height: 28px; background-color: #eafbf4;
                                            border-radius: 50%; text-align: center; line-height: 28px;
                                            font-size: 13px; font-weight: 700; color: #0b3b30;">
                                  2
                                </div>
                              </td>
                              <td>
                                <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">
                                  <strong style="color: #111827;">Describe your product</strong><br />
                                  Head to the <strong>Generate</strong> tab, describe your product,
                                  and pick a category (e.g. Home Decor, Beauty, Fashion).
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Step 3 -->
                      <tr>
                        <td>
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td valign="top" width="36"
                                  style="padding-top: 1px;">
                                <div style="width: 28px; height: 28px; background-color: #eafbf4;
                                            border-radius: 50%; text-align: center; line-height: 28px;
                                            font-size: 13px; font-weight: 700; color: #0b3b30;">
                                  3
                                </div>
                              </td>
                              <td>
                                <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">
                                  <strong style="color: #111827;">Hit Generate</strong><br />
                                  Your lifestyle image and ready-to-post captions will appear instantly.
                                  Copy them straight to Pinterest, Instagram, Facebook, or Google Ads.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding-bottom: 40px; text-align: center;">
                    <a href="${APP_URL}/app"
                       style="display: inline-block; padding: 14px 32px;
                              background-color: #5fe6c4;
                              color: #0b3b30; font-size: 15px; font-weight: 600;
                              text-decoration: none; border-radius: 8px;
                              letter-spacing: 0.1px;">
                      Open Ombryth →
                    </a>
                  </td>
                </tr>

                ${referralSection}

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #f3f4f6; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                Ombryth &middot;
                <a href="mailto:hello@ombryth.com?subject=Unsubscribe"
                   style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendWelcomeEmail(
  email: string,
  referralCode?: string
): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL ?? "hello@ombryth.com"

  await resend.emails.send({
    from: `Ombryth <${from}>`,
    to: email,
    subject: "Welcome to Ombryth 🎉",
    html: buildWelcomeHtml(referralCode),
  })
}
