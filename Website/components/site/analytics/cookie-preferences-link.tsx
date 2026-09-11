"use client";

/**
 * The footer's "Cookie preferences" link, reopening `CookieConsentBanner`
 * so a visitor can change an earlier analytics choice. A client component
 * for the same reason `CreditsModal` is — the interaction it triggers only
 * makes sense in the browser — while the rest of `footer.tsx` stays a
 * server component.
 *
 * @file      cookie-preferences-link.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { reopenCookiePreferences } from "@/lib/analytics-consent";

export/** Styled to match its sibling footer links (Terms/Privacy/Contact). */
const CookiePreferencesLink = () =>
{
    return (
        <button
            className={ "cursor-pointer text-sm text-muted-foreground transition-colors "
                + "hover:text-foreground" }
            onClick={ reopenCookiePreferences }
            type="button">
            Cookie preferences
        </button>
    );
};
