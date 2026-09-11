/**
 * Crash reporting via Sentry. Deliberately minimal for v1 -- initialization
 * is a single `Sentry.init(...)` call with no `tracesSampleRate`, no session
 * replay, and no profiling (see RELEASE_CHECKLIST.md §D1). Gated on `__DEV__`
 * the same way `AdUnits.ts` gates ad requests, so development builds never
 * report to the dashboard configured for production users.
 *
 * This call also *is* v1's usage analytics (§D2): `Sentry.init` turns on
 * automatic session tracking by default (no extra option needed), which is
 * what powers Sentry's release-health dashboard (crash-free session %,
 * adoption per release). No separate analytics SDK, no new PII -- see §D2
 * for why that's a deliberate scope decision, not an oversight.
 *
 * @module noteferry/Domain/Runtime/Sentry
 *
 * @file      Sentry.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Sentry from "@sentry/react-native";

export/**
       * Initializes Sentry crash reporting. Call once, as early as possible in
       * boot (see `_layout.tsx`). Reads the DSN from `EXPO_PUBLIC_SENTRY_DSN` --
       * an unset DSN makes the SDK a no-op rather than throwing, so a blank
       * value in local/CI environments is safe.
       *
       * @category Runtime
       * @since 1.0.0
       */
const InitializeSentry = (): void =>
{
    Sentry.init({
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        enabled: !__DEV__
    });
};
