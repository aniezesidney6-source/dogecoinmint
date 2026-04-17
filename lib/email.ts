import { Resend } from 'resend'

// Lazy-init so the build doesn't throw when RESEND_API_KEY is absent
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM = 'DogecoinMint <support@dogecoinmint.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─── Shared HTML helpers ──────────────────────────────────────────────────────

function emailWrapper(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050810;font-family:'Helvetica Neue',Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050810;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;">
        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;">
            <span style="color:#F7B731;">Dogecoin</span><span style="color:#00FFB2;">Mint</span>
          </span>
        </td></tr>
        ${body}
        <!-- Footer -->
        <tr><td style="padding-top:32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">
            © ${new Date().getFullYear()} DogecoinMint. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function ctaButton(label: string, href: string, color = '#F7B731', textColor = '#050810'): string {
  return `<tr><td align="center" style="padding:24px 0 8px;">
    <a href="${href}" style="display:inline-block;padding:14px 32px;background:${color};color:${textColor};font-weight:700;font-size:14px;border-radius:100px;text-decoration:none;">${label}</a>
  </td></tr>`
}

// ─── Verification email ───────────────────────────────────────────────────────

export async function sendVerificationEmail(
  email: string,
  username: string,
  code: string
): Promise<void> {
  const html = emailWrapper(`
    <tr><td style="padding-bottom:24px;">
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#ffffff;">Verify your email</h2>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);">Hi ${username}, enter this code to verify your DogecoinMint account.</p>
    </td></tr>
    <tr><td align="center" style="padding:20px 0 28px;">
      <div style="display:inline-block;padding:20px 40px;background:rgba(247,183,49,0.08);border:1px solid rgba(247,183,49,0.25);border-radius:12px;">
        <span style="font-family:'Courier New',monospace;font-size:42px;font-weight:900;color:#F7B731;letter-spacing:12px;">${code}</span>
      </div>
    </td></tr>
    <tr><td style="padding-bottom:8px;">
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);text-align:center;">This code expires in <strong style="color:#ffffff;">15 minutes</strong>.</p>
    </td></tr>
    <tr><td>
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);text-align:center;">If you didn't create an account on DogecoinMint, you can safely ignore this email.</p>
    </td></tr>
  `)

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Your DogecoinMint verification code: ${code}`,
    html,
  })
}

// ─── Welcome email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
  const verifyUrl = `${APP_URL}/verify-email?email=${encodeURIComponent(email)}`

  const html = emailWrapper(`
    <tr><td style="padding-bottom:24px;">
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#ffffff;">Welcome, ${username}! 🎉</h2>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);">Your DogecoinMint account has been created successfully.</p>
    </td></tr>
    <tr><td style="padding-bottom:20px;">
      <div style="padding:16px;background:rgba(0,255,178,0.06);border:1px solid rgba(0,255,178,0.2);border-radius:10px;">
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.8);">
          🪙 You've received <strong style="color:#00FFB2;">5 DOGE</strong> as a welcome bonus — it's already in your wallet.
        </p>
      </div>
    </td></tr>
    <tr><td style="padding-bottom:8px;">
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);">One last step: verify your email to start mining and unlock all features.</p>
    </td></tr>
    ${ctaButton('Verify My Email →', verifyUrl)}
    <tr><td>
      <p style="margin:8px 0 0;font-size:12px;color:rgba(255,255,255,0.3);text-align:center;">Button not working? Copy this link: <a href="${verifyUrl}" style="color:#F7B731;">${verifyUrl}</a></p>
    </td></tr>
  `)

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: '🐕 Welcome to DogecoinMint — You\'re almost ready!',
    html,
  })
}

// ─── Password reset email ─────────────────────────────────────────────────────

export async function sendPasswordResetEmail(
  email: string,
  username: string,
  token: string
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  const html = emailWrapper(`
    <tr><td style="padding-bottom:24px;">
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#ffffff;">Reset your password</h2>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);">Hi ${username}, you requested a password reset for your DogecoinMint account.</p>
    </td></tr>
    ${ctaButton('Reset Password →', resetUrl)}
    <tr><td style="padding-top:20px;">
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.4);text-align:center;">This link expires in <strong style="color:#ffffff;">1 hour</strong>.</p>
    </td></tr>
    <tr><td style="padding-top:8px;">
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);text-align:center;">If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
    </td></tr>
    <tr><td style="padding-top:12px;">
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);text-align:center;">Or copy this URL: <a href="${resetUrl}" style="color:#F7B731;">${resetUrl}</a></p>
    </td></tr>
  `)

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: 'Reset your DogecoinMint password',
    html,
  })
}
