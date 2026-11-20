# Google / Discord sign-in: owner setup

The buttons are in the Account dialog. They stay usable with the email link if a provider is off: the app checks `/auth/v1/settings` first and shows "... sign-in is not enabled yet" instead of redirecting.

## 1. Supabase dashboard (project `anime-op-quiz`)

Authentication > Sign In / Providers:

- Enable **Google** and paste its Client ID + Client Secret (from the Google console).
- Enable **Discord** and paste its Client ID + Client Secret (from the Discord developer portal).

Authentication > URL Configuration: leave the existing site URL and redirect allow-list (prod + localhost). Do not add more origins for this.

## 2. Callback URL to register at each provider

`https://meqpyffiuqylljsxupfh.supabase.co/auth/v1/callback`

- Google Cloud Console > APIs & Services > Credentials > OAuth client (Web application) > **Authorized redirect URIs**.
- Discord developer portal > your application > OAuth2 > **Redirects**.

The app's own origin (`redirectTo`) is passed at sign-in and must be on the allow-list above. Nothing else needs registering at the providers.

## 3. CSP

No change needed. Sign-in moves the browser to the provider and back (top-level navigation, not fetch or form post). The settings check uses `https://*.supabase.co`, already in `connect-src` in `next.config.ts`.

## 4. Test after enabling

1. Open the Account dialog while signed out.
2. Click "Continue with Google" (and Discord). The provider's consent screen should appear.
3. Return to the site: the Account dialog should show "Signed in as ...".
4. Before enabling a provider, the same click should show "... sign-in is not enabled yet." and not leave the page.

The Supabase/provider consoles and a real click-through have not been tested from the code side.
