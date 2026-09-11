"use client";

/**
 * A minimal bottom banner asking first-time visitors whether to allow
 * Google Analytics. Declining, or leaving it, keeps analytics off — see
 * `GoogleAnalytics`, which only ever loads after "Accept" is chosen here.
 * Reappears on demand via the footer's "Cookie preferences" link
 * (`CookiePreferencesLink`), so a visitor can change their mind later.
 *
 * @file      cookie-consent-banner.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    type AnalyticsConsent,
    ReopenCookiePreferencesEvent,
    getStoredAnalyticsConsent,
    isProductionHost,
    setStoredAnalyticsConsent
} from "@/lib/analytics-consent";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Shows itself the first time a visitor (on production) has no recorded
 * consent choice, and again whenever `reopenCookiePreferences` fires.
 */
export /**
        *
        */
const CookieConsentBanner = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);

    useEffect(() =>
    {
        setIsVisible(isProductionHost() && getStoredAnalyticsConsent() === null);

        const reopen = () => setIsVisible(true);

        window.addEventListener(ReopenCookiePreferencesEvent, reopen);

        return () => window.removeEventListener(ReopenCookiePreferencesEvent, reopen);
    }, []);

    if (!isVisible)
    {
        return null;
    }

    const choose = (consent: AnalyticsConsent) =>
    {
        setStoredAnalyticsConsent(consent);
        setIsVisible(false);
    };

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card px-6 py-4">
            <div
                className={ "mx-auto flex max-w-6xl flex-col items-center gap-4 "
                    + "sm:flex-row sm:justify-between" }>
                <p className="text-sm text-muted-foreground">
                    { "We'd like to use Google Analytics to see which pages get "
                        + "visited. Nothing loads unless you accept. See our " }
                    <a
                        className="text-primary underline underline-offset-4 hover:no-underline"
                        href="/privacy#cookies">
                        Privacy Policy
                    </a>
                    .
                </p>
                <div className="flex shrink-0 items-center gap-3">
                    <Button
                        className="cursor-pointer"
                        onClick={ () => choose("denied") }
                        size="sm"
                        variant="outline">
                        Decline
                    </Button>
                    <Button
                        className="cursor-pointer"
                        onClick={ () => choose("granted") }
                        size="sm">
                        Accept
                    </Button>
                </div>
            </div>
        </div>
    );
};
