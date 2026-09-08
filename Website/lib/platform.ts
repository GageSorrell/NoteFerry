/**
 * Server-side `User-Agent` sniffing used to pick which pair of store
 * badges the hero and closing CTA show above the fold: Microsoft Store +
 * Google Play for Windows/Android (and anything unrecognized), or the Mac
 * App Store + (iOS) App Store for Apple platforms. This only ever narrows
 * that two-button choice — the full set of store links always lives in
 * the platforms table further down the page (`components/site/sections/platforms.tsx`)
 * regardless of what this detects.
 *
 * @file      platform.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export/**
       * The two badge groupings a visitor's device can fall into.
       */
type StorePlatformGroup = "apple" | "default";

export/**
       * Buckets a raw `User-Agent` header into one of the two badge groups.
       * Missing or unrecognized user agents fall back to `"default"`
       * (Microsoft Store + Play Store), per the landing page's stated
       * "when unsure" behavior.
       *
       * @param userAgent - The raw `User-Agent` request header, if present.
       */
const detectStorePlatformGroup = (userAgent: string | null): StorePlatformGroup =>
{
    if (!userAgent)
    {
        return "default";
    }

    // iPhone/iPad/iPod covers iOS Safari and most in-app browsers. iPadOS
    // 13+ instead reports as "Macintosh; Intel Mac OS X", which the
    // Macintosh check below also catches — either way it lands in the
    // Apple group, which is all this distinction needs.
    if (/iPhone|iPad|iPod/i.test(userAgent))
    {
        return "apple";
    }

    if (/Macintosh|Mac OS X/i.test(userAgent))
    {
        return "apple";
    }

    return "default";
};
