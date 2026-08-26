# NoteFerry Auth Setup (Notion identity)

Manual / external configuration for sign-in. The app code is wired; these steps
live in dashboards and portals only you can complete.

**NoteFerry signs in with the user's Notion account** — Notion is enabled as a
Supabase Auth provider. Granting the NoteFerry **content** integration access to
pages is a **separate** step (the existing `notion-oauth-callback` flow). These
are two distinct Notion OAuth authorizations (see §2 vs §3).

**Project:** `NoteFerry` — ref `mbstkyukxldzhwmnsall`
**Supabase auth callback (identity provider redirects here):**
`https://mbstkyukxldzhwmnsall.supabase.co/auth/v1/callback`
**Content integration callback (page grant redirects here):**
`https://mbstkyukxldzhwmnsall.supabase.co/functions/v1/notion-oauth-callback`
**App deep-link scheme:** `noteferry://` (set in `app.json`)

---

## 0. How the flow works (context)

**Sign in (identity):** `signInWithOAuth({ provider: "notion" })` → in-app browser
(`expo-web-browser`) → Notion login → Notion redirects to the **Supabase auth
callback** → Supabase redirects back to the app at `noteferry://…` → the app calls
`setSession`. Code: `src/Domain/Auth/OAuth.ts`.

**Grant access (content):** a *separate* Notion OAuth via the content integration
(`ConnectNotion()` → `notion-oauth-callback`), whose access/refresh tokens are
stored server-side in `private.notion_connection_credentials` and used for the
Notion API. The client secret never touches the app (§7).

No provider secret lives in the app either way.

---

## 1. Supabase → Authentication → URL Configuration  ✅ done

- **Site URL:** `noteferry://`
- **Redirect URLs (allow-list):**
  - `noteferry://**`
  - For a dev client over Metro, also the dev URL Metro prints, e.g.
    `exp://192.168.x.x:8081/--/**` (your machine's LAN IP/port).

---

## 2. Notion as a sign-in provider (identity)

**Notion → My integrations** (notion.so/my-integrations) → **New integration** →
type **Public**. Under **OAuth Domain & URIs**:
- **Redirect URI:** `https://mbstkyukxldzhwmnsall.supabase.co/auth/v1/callback`
- Copy the **OAuth client ID** and **client secret**.

**Supabase dashboard → Authentication → Providers → Notion:**
- Enable, paste the **Client ID** + **Client secret**, save.

> This authorization establishes *who the user is*. Notion always shows a page
> picker during OAuth; the pages chosen here are **not** what NoteFerry uses for
> content — that is the separate grant in §3. Keeping the two apart is why sign-in
> and "Grant access" are two screens.

---

## 3. Content integration (page grant)  ✅ already configured

The existing **content** integration is unchanged. Confirm:
- Its **Redirect URI** is the content callback:
  `https://mbstkyukxldzhwmnsall.supabase.co/functions/v1/notion-oauth-callback`
- Its client id/secret are set as **Edge Function secrets**
  `NOTION_OAUTH_CLIENT_ID` / `NOTION_OAUTH_CLIENT_SECRET`.

> You *may* reuse one Notion integration for both §2 and §3 by adding both
> redirect URIs to it — but then the two authorizations share one app. Two
> separate integrations keep identity and content cleanly independent
> (recommended).

---

## 4. Build & run (dev build required)

Native modules (`expo-secure-store`) + the custom `noteferry://` scheme mean
**Expo Go will not work** — use a dev build:

```
cd Application
npx expo run:android     # emulator/device
# or
npx expo run:ios         # iOS Simulator — a free Apple ID is enough
```

`.env` is already populated with the project URL and publishable key.

---

## 5. Test

1. Launch the dev build → land on the **sign-in** screen.
2. Tap **Continue with Notion** → complete Notion login in the browser sheet → it
   returns to the app and a session is created.
3. You should be routed onward (onboarding → Grant access → …). Kill and relaunch
   — the session is restored from encrypted secure storage (no re-login).
4. Verify server-side: the new user appears in **Supabase → Authentication →
   Users**, and a matching `app.profiles` row exists (auto-created by the
   `on_auth_user_created` trigger).

If step 2 bounces with "redirect not allowed", the value the app sent doesn't
match the allow-list — check Metro's logs for the exact `redirectTo` and add it
under §1.

---

## 6. What the app already does (no action needed)

- Encrypted session persistence (`SecureSessionStore`: AES key in SecureStore,
  ciphertext in AsyncStorage).
- Token auto-refresh tied to app foreground/background (`AppState`).
- `NoteFerryAuthProvider` (React session context) + `UseAuth`.
- `CurrentUser` Effect seam for application/business code.
- Route protection / onboarding gating in `src/app/_layout.tsx`.
