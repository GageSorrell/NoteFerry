# NoteFerry Sentry Setup (crash reporting)

Manual / external configuration for crash reporting (RELEASE_CHECKLIST.md §D1).
The app code is wired; these steps live in the Sentry dashboard and EAS only
you can complete.

**Scope for v1, deliberately minimal:** crash reporting + Sentry's bundled
release-health (crash-free session %, adoption per release) only. No
`tracesSampleRate`, no session replay, no profiling -- see §D2 of the
checklist for why release health alone satisfies the "usage analytics" item
too, with no separate SDK.

---

## 0. How it's wired (no action needed)

- `Source/Domain/Runtime/Sentry.ts` -- `InitializeSentry()`, called once at
  the top of `Source/App/_layout.tsx`. `enabled: !__DEV__`, so development
  builds never report.
- `app.json`'s `plugins` array has the `@sentry/react-native/expo` config
  plugin, which wires the native Android/iOS Sentry SDKs and registers the
  EAS Build hooks that upload source maps automatically during a Release
  build -- no hand-written `eas.json` build hooks.
- `EXPO_PUBLIC_SENTRY_DSN` is read at runtime by `Sentry.ts`. It is *not*
  secret (DSNs are meant to be embedded in shipped clients), so it lives in
  `.env`/`.env.example` like the Supabase URL/key.

---

## 1. Create the Sentry project

**Sentry dashboard → Projects → Create Project** → platform **React Native**.

Note down:
- **DSN** (Project Settings → Client Keys (DSN))
- **Organization slug** (the segment after `sentry.io/organizations/` in the
  dashboard URL, or Settings → General Settings)
- **Project slug** (Project Settings → General Settings)

---

## 2. Runtime DSN (local + EAS)

Set `EXPO_PUBLIC_SENTRY_DSN` to the DSN from step 1:
- **Local dev:** already blank in `Application/Mobile/.env` -- fill it in if
  you want dev builds to report (remember `Sentry.ts` still no-ops unless
  `__DEV__` is overridden).
- **EAS builds:** add `EXPO_PUBLIC_SENTRY_DSN` as an EAS environment variable
  (`eas env:create --name EXPO_PUBLIC_SENTRY_DSN --value <dsn> --visibility plaintext`)
  scoped to the `production`/`preview` profiles, or via the EAS dashboard's
  **Project → Environment variables**.

---

## 3. Source-map upload (org/project/auth token)

The `@sentry/react-native/expo` plugin entry in `app.json` is left without an
explicit `organization`/`project` on purpose: those are looked up from the
`SENTRY_ORG` / `SENTRY_PROJECT` build-time environment variables instead of
being committed. Set, as EAS environment variables (same place as step 2):
- `SENTRY_ORG` -- the organization slug from step 1
- `SENTRY_PROJECT` -- the project slug from step 1
- `SENTRY_AUTH_TOKEN` -- **as a secret**, not plaintext
  (`eas env:create --name SENTRY_AUTH_TOKEN --value <token> --visibility secret`).
  Create the token at Sentry → Settings → Auth Tokens, scoped to
  `project:releases` and `org:read` at minimum.

Without these three, the build still succeeds -- the plugin just skips the
source-map upload step and logs a warning, so stack traces in the dashboard
will be minified until they're set.

---

## 4. Acceptance test

1. Temporarily flip `enabled: !__DEV__` to `enabled: true` in
   `Source/Domain/Runtime/Sentry.ts` (or run a preview/production build,
   where it's already `true`).
2. Trigger a test exception (e.g. a throw wired to a dev-only button, or
   `Sentry.captureException(new Error("NoteFerry Sentry test"))` from the
   Metro console/dev menu).
3. Confirm the event shows up in **Sentry dashboard → Issues** for the
   project from step 1, then revert the temporary `enabled` change.

---

## 5. What's still open

- §D3 of the checklist (severity-tiered error UI/Sentry tagging) builds on
  top of this -- `ReportError.ts` will wrap `Sentry.captureException`.
- §D2's privacy-policy mention of crash/session diagnostics is a separate
  website content change, not tracked here.
