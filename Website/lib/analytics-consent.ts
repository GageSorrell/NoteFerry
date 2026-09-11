/**
 * Shared state behind the "Cookie preferences" flow: whether the visitor
 * has granted or declined analytics cookies, persisted in `localStorage`
 * (not a cookie itself), plus the plumbing `GoogleAnalytics` and
 * `CookieConsentBanner` use to stay in sync with each other and with the
 * footer's "Cookie preferences" link.
 *
 * @file      analytics-consent.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { siteConfig } from "@/content/site-config";

/** A visitor's recorded choice about analytics cookies. */
export type AnalyticsConsent = "granted" | "denied";

const StorageKey = "noteferry-analytics-consent";
const ProductionHostname = new URL(siteConfig.canonicalUrl).hostname;

/** Fired on `window` whenever the stored consent choice changes. */
export /**
        *
        */
const AnalyticsConsentChangedEvent = "noteferry:analytics-consent-changed";

/**
 * Fired on `window` when the footer's "Cookie preferences" link is used to
 * reopen the banner after a choice was already made.
 */
export /**
        *
        */
const ReopenCookiePreferencesEvent = "noteferry:reopen-cookie-preferences";

/**
 * Whether the page is being viewed on the real production domain, rather
 * than local dev or a Vercel preview deployment — analytics stays off
 * everywhere else so those never report traffic into the live property.
 */
export /**
        *
        */
const isProductionHost = (): boolean =>
{
    return typeof window !== "undefined" && window.location.hostname === ProductionHostname;
};

/**
 * Reads the visitor's stored consent choice, or `null` if they haven't
 * chosen yet (or `localStorage` is unavailable — a private window, or this
 * running during server-side rendering).
 */
export /**
        *
        */
const getStoredAnalyticsConsent = (): AnalyticsConsent | null =>
{
    if (typeof window === "undefined")
    {
        return null;
    }

    try
    {
        const value = window.localStorage.getItem(StorageKey);

        return value === "granted" || value === "denied" ? value : null;
    }
    catch
    {
        return null;
    }
};

/**
 * Records the visitor's choice and notifies any mounted
 * `GoogleAnalytics`/`CookieConsentBanner` instances.
 */
export /**
        *
        */
const setStoredAnalyticsConsent = (consent: AnalyticsConsent): void =>
{
    try
    {
        window.localStorage.setItem(StorageKey, consent);
    }
    catch
    {
        /* Ignore — worst case, the banner reappears next visit. */
    }

    window.dispatchEvent(new Event(AnalyticsConsentChangedEvent));
};

/** Reopens the cookie-preferences banner even after a choice was already made. */
export /**
        *
        */
const reopenCookiePreferences = (): void =>
{
    window.dispatchEvent(new Event(ReopenCookiePreferencesEvent));
};
