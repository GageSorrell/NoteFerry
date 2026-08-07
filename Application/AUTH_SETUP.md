# Notivex Auth Setup (Google now, Apple deferred)

Manual / external configuration for the OAuth sign-in slice. The app code is
already wired; these steps live in dashboards and portals only you can complete.

**Current path:** Google sign-in is the active method. The **Apple** button is
present but a **no-op** until Apple is configured (see §3) — tapping it does
nothing rather than erroring.

**Project:** `Notivex` — ref `mbstkyukxldzhwmnsall`
**Supabase OAuth callback (providers redirect here):**
`https://mbstkyukxldzhwmnsall.supabase.co/auth/v1/callback`
**App deep-link scheme:** `notivex://` (set in `app.json`)

---

## 0. How the flow works (context)

`signInWithOAuth` → in-app browser (`expo-web-browser`) → provider login →
provider redirects to the **Supabase callback** above → Supabase redirects back
to the app at `notivex://…` → the app calls `setSession`. The provider secrets
never touch the app (ArchitectureInitialDraft.md §6, §7).

---

## 1. Supabase → Authentication → URL Configuration  ✅ done

`config.toml` only configures the **local** stack; the **remote** project must
be set in the dashboard.

- **Site URL:** `notivex://`
- **Redirect URLs (allow-list):**
  - `notivex://**`
  - For a dev client over Metro, also the dev URL Metro prints, e.g.
    `exp://192.168.x.x:8081/--/**` (your machine's LAN IP/port).

---

## 2. Google  ✅ done

**Google Cloud Console** (console.cloud.google.com):
1. Project → **OAuth consent screen** → External; add your Google account under
   **Test users** (only test users can sign in until the app is published).
2. **Credentials → Create credentials → OAuth client ID → Web application.**
3. **Authorized redirect URIs** →
   `https://mbstkyukxldzhwmnsall.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client secret**.

**Supabase dashboard → Authentication → Providers → Google:**
- Enable, paste **Client ID** + **Client secret**, save. Leave "Authorized
  Client IDs" empty (that field is for the native-SDK flow, which we are not
  using).

> The sign-in **button** is the native `GoogleSigninButton` component (so it
> needs a dev build, not Expo Go), but the **flow** is the standard web OAuth —
> `signInWithOAuth` + `WebBrowser` in `src/features/auth/oauth.ts`. No
> `webClientId` or Android OAuth client is required.

---

## 3. Apple  ⏳ deferred (button is a no-op today)

Not required to develop. Do this later, before App Store release. Requires an
**Apple Developer Program** membership.

**Apple Developer portal** (developer.apple.com → Certificates, IDs & Profiles):
1. **App ID** for the app's bundle id with **Sign in with Apple** enabled.
2. **Services ID** (becomes the OAuth *client id*) with Sign in with Apple:
   - **Return URL:** `https://mbstkyukxldzhwmnsall.supabase.co/auth/v1/callback`
   - Domain: `mbstkyukxldzhwmnsall.supabase.co`
3. Create a **Sign in with Apple key** (`.p8`); note **Key ID** and **Team ID**.

**Supabase dashboard → Authentication → Providers → Apple:**
- Enable. Set the **Services ID** as client id; provide Team ID, Key ID, and
  `.p8` so Supabase can mint the client secret. Save.

**To re-activate the Apple button** once the above is done, restore its handler
in `src/app/sign-in.tsx` (call `HandleSignIn("apple")` instead of the no-op).
For App Store release, prefer **native** "Sign in with Apple"
(`expo-apple-authentication` → `signInWithIdToken({ provider: "apple" })`),
which Apple requires on iOS when other social logins are offered.

---

## 4. Build & run (dev build required)

Native modules (`expo-secure-store`) + the custom `notivex://` scheme mean
**Expo Go will not work** — use a dev build:

```
cd Application
npx expo run:android     # emulator/device — no Apple account needed
# or
npx expo run:ios         # iOS Simulator — a free Apple ID is enough
```

`.env` is already populated with the project URL and publishable key.

---

## 5. Test

1. Launch the dev build → you should land on the **sign-in** screen (route
   protection redirects signed-out users there).
2. Tap **Continue with Google** → complete login in the browser sheet → it
   returns to the app and a session is created. (The **Apple** button does
   nothing for now.)
3. You should be routed to the app's `index` screen. Kill and relaunch — the
   session is restored from encrypted secure storage (no re-login).
4. Verify server-side: the new user appears in **Supabase → Authentication →
   Users**, and a matching `app.profiles` row exists (auto-created by the
   `on_auth_user_created` trigger).

If step 2 bounces back with "redirect not allowed", the value the app sent
doesn't match the allow-list — check Metro's logs for the exact `redirectTo`
and add it under §1.

---

## 6. What the app already does (no action needed)

- Encrypted session persistence (`SecureSessionStore`: AES key in SecureStore,
  ciphertext in AsyncStorage).
- Token auto-refresh tied to app foreground/background (`AppState`).
- `AuthProvider` (React session context) + `useAuth`.
- `CurrentUser` Effect seam for application/business code.
- Route protection in `src/app/_layout.tsx`.
- Apple button rendered but wired to a no-op (§3).
