# Google and Facebook sign-in setup

The login page shows **كمّل بجوجل** and **كمّل بفيسبوك** only when that
provider's two env vars are set. If they are missing, the app keeps working
with email and password only, so you can set up one provider at a time.

Production URL used below: `https://congrats-eta.vercel.app`. If you move to a
custom domain, add the new redirect URIs too and update `AUTH_URL`.

Never commit secrets to the repo. Put them only in Vercel → Project → Settings →
Environment Variables.

---

## 1. Google

1. Open <https://console.cloud.google.com/> and create (or pick) a project, e.g. "Congrats".
2. **APIs & Services → OAuth consent screen** (now called "Google Auth Platform → Branding/Audience"):
   - User type: **External**.
   - App name: `Congrats`. Support email: your email. Logo is optional. If you
     upload one, Google may ask for verification.
   - Authorized domain: `congrats-eta.vercel.app` (or your own domain).
   - Developer contact: your email.
   - Scopes: the defaults `openid`, `.../auth/userinfo.email` and
     `.../auth/userinfo.profile`. Add nothing else, so no review is needed.
   - **Publish app** (Audience → "In production"). While it is in "Testing",
     only the test users you list can sign in.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**. Name: `Congrats web`.
   - Authorized JavaScript origins: `https://congrats-eta.vercel.app`
   - Authorized redirect URIs:
     `https://congrats-eta.vercel.app/api/auth/callback/google`
   - For local testing, also add `http://localhost:3000` and
     `http://localhost:3000/api/auth/callback/google`.
4. Copy the **Client ID** into `AUTH_GOOGLE_ID` and the **Client secret** into `AUTH_GOOGLE_SECRET`.

Note: Google blocks its sign-in inside the Facebook, Messenger and Instagram
in-app browsers (`Error 403: disallowed_useragent`). The login page detects
those browsers and replaces the Google button with a hint to open the page in
Chrome or Safari, plus a "copy link" button. Facebook and email sign-in still
work there.

## 2. Facebook

1. Open <https://developers.facebook.com/apps> → **Create app**.
   - Use case: **Authenticate and request data from users with Facebook Login**.
   - App type, if asked: **Consumer**. Name: `Congrats`. Contact email: yours.
   - Link your Business portfolio if you have one (needed later for Live mode).
2. **Use cases → Authentication and account creation → Customize**:
   - Permissions: add **email** next to **public_profile**, which is already there.
     Both are "standard access" and need no App Review.
3. **Facebook Login → Settings**:
   - Client OAuth login: **On**. Web OAuth login: **On**.
   - Enforce HTTPS: **On**. Use Strict Mode for redirect URIs: **On**.
   - **Valid OAuth Redirect URIs**:
     `https://congrats-eta.vercel.app/api/auth/callback/facebook`
   - Login from devices: Off.
4. **App settings → Basic**:
   - App domains: `congrats-eta.vercel.app`
   - Privacy Policy URL: `https://congrats-eta.vercel.app/ar/privacy`
   - Terms of Service URL: `https://congrats-eta.vercel.app/ar/terms`
   - User data deletion: "Data deletion instructions URL" →
     `https://congrats-eta.vercel.app/ar/privacy`, or a contact page that says how to ask for deletion.
   - Category: e.g. "Lifestyle". App icon: 1024×1024.
   - Click **+ Add platform → Website**, Site URL `https://congrats-eta.vercel.app/`.
   - Copy the **App ID** into `AUTH_FACEBOOK_ID` and the **App secret** (click
     "Show") into `AUTH_FACEBOOK_SECRET`.
5. Switch the app from **Development** to **Live** (toggle at the top or
   "Publish"). In Development mode, only people with a role on the app can sign in.

Some Facebook accounts have no email (they were made with a phone number), and
people can untick the email permission. Those users still get an account. It is
stored with a placeholder address like `fb-1234567890@users.congrats.local`, which
never receives email. In admin notifications it shows as
"Facebook account (no email)". Such users cannot use "forgot password", because they
have no password. They always sign in with Facebook.

## 3. Vercel environment variables

Set these for **Production** (and for Preview if you test there). Then redeploy:

| Variable | Value |
|---|---|
| `AUTH_GOOGLE_ID` | Google OAuth Client ID (`…apps.googleusercontent.com`) |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client secret |
| `AUTH_FACEBOOK_ID` | Facebook App ID |
| `AUTH_FACEBOOK_SECRET` | Facebook App secret |
| `AUTH_URL` | `https://congrats-eta.vercel.app` (should already be set) |
| `AUTH_SECRET` | already set; keep it |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | your WhatsApp number in international digits, e.g. `2010xxxxxxxx`. Enables "عندك سؤال؟ كلمنا واتساب". Needs a redeploy because it is baked into the build. |

## 4. Check it

1. Open `/ar/login` in a normal phone browser. Both buttons should show.
   Tap each one and confirm you land on the dashboard. You should also get the
   "New sign-up" admin email (Via: Google/Facebook).
2. Send yourself the link in Messenger and open it there. The Google button
   should be greyed out with the "open in browser" hint. Facebook and email
   sign-in should work.
3. If a sign-in fails, you come back to the login page with a short Arabic
   error. Common causes:
   - `redirect_uri_mismatch`: the redirect URI is not exactly the one above.
   - Facebook "app not active": the app is still in Development mode.
