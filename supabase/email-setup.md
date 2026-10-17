# Pocket — Supabase Auth Email Setup

Use this checklist in the existing Supabase project. Do not place SMTP credentials or service-role keys in Vercel frontend environment variables.

## A. Canonical URLs

1. In Vercel → Project → Settings → Environment Variables, set:
   - `VITE_SITE_URL` = `https://YOUR_REAL_POCKET_DOMAIN` (the exact public HTTPS origin, no trailing slash).
2. Redeploy Vercel after setting it.
3. In Supabase → Authentication → URL Configuration:
   - **Site URL**: the exact same production origin, e.g. `https://your-pocket-domain.vercel.app` (replace with the real domain).
   - **Redirect URLs**: add `https://YOUR_REAL_POCKET_DOMAIN/**` and, for local development, `http://localhost:5173/**`. Add any custom domain separately. Do not set Site URL to a wildcard.
4. In Supabase → Authentication → Sign In / Providers → Email, turn **Confirm email** on.

The frontend passes `VITE_SITE_URL` to Supabase for sign-up confirmation, resend confirmation, and password recovery. This is why the production URL must be correct and included in the allow list.

## B. SMTP (required for real-world delivery)

Supabase's built-in mail service is intended for testing: it is rate-limited and may only deliver to pre-authorized/team addresses. For normal users, configure a custom SMTP provider.

Example using Resend (or use the equivalent credentials from your chosen SMTP provider):

1. Create a Resend account and verify a sending domain you control.
2. In Supabase → Authentication → SMTP Settings (sometimes under Project Settings → Authentication), enable custom SMTP and enter:
   - Sender email: `no-reply@YOUR_VERIFIED_DOMAIN`
   - Sender name: `Pocket`
   - SMTP host: `smtp.resend.com`
   - SMTP port: `465` (SSL) or `587` (STARTTLS), as supported by your provider
   - SMTP username: `resend`
   - SMTP password: your Resend API key (keep this only in Supabase SMTP settings; never in frontend code)
3. Save, then test with an inbox you control. Verify the sender domain's DNS records in Resend. If your provider uses different SMTP values, use the provider's own values instead.
4. In the SMTP provider, disable click/open tracking for authentication emails if it rewrites URLs; rewritten confirmation links can fail.

## C. Email templates

In Supabase → Authentication → Email Templates, keep the secure confirmation URL variable intact. Use the templates below or preserve the default templates if you have not customized them.

### Confirm signup

Subject: `Confirm your Pocket email`

```html
<h2>Welcome to Pocket</h2>
<p>Confirm your email address to finish creating your account.</p>
<p><a href="{{ .ConfirmationURL }}">Confirm email address</a></p>
<p>If you did not create a Pocket account, you can ignore this email.</p>
```

### Reset password

Subject: `Reset your Pocket password`

```html
<h2>Reset your Pocket password</h2>
<p>We received a request to reset your password.</p>
<p><a href="{{ .ConfirmationURL }}">Choose a new password</a></p>
<p>If you did not request this, you can ignore this email.</p>
```

Use `{{ .ConfirmationURL }}` rather than constructing a URL manually. Supabase puts the verification token and requested redirect into this URL. Do not replace it with `{{ .SiteURL }}` alone, or append raw tokens to a hand-built link unless you also implement the matching verification endpoint.

## D. End-to-end test

1. Create a test account using an email inbox you can access. Check Inbox and Spam/Junk.
2. Click Confirm email. It should return to the canonical Pocket URL. Sign in after confirmation.
3. Sign out, select Forgot password, enter the same email, and open the reset message.
4. The link should open Pocket's **Choose a new password** form. Enter and confirm a password of at least 8 characters, save, then sign in with the new password.
5. If email is not delivered, check Supabase Authentication logs and SMTP provider logs. If the link opens the wrong site or shows a redirect error, re-check Site URL, Redirect URLs, and `VITE_SITE_URL`. If the link says expired/invalid, request a fresh email and disable provider click tracking.
