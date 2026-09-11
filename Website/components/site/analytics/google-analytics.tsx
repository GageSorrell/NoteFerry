"use client";

/**
 * Loads Google Analytics (GA4), but only once the visitor has granted
 * analytics consent via `CookieConsentBanner` — before that, no GA script
 * ever reaches the page and no GA cookies are set. Also stays off outside
 * the real production domain, so local dev and Vercel preview deployments
 * never report traffic into the live property.
 *
 * @file      google-analytics.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    AnalyticsConsentChangedEvent,
    getStoredAnalyticsConsent,
    isProductionHost
} from "@/lib/analytics-consent";
import { useEffect, useState } from "react";
import Script from "next/script";
import { siteConfig } from "@/content/site-config";

/**
 * Renders GA4's loader script once consent is granted on production;
 * renders nothing before that.
 */
export /**
        *
        */
const GoogleAnalytics = () =>
{
    const [ isGranted, setIsGranted ] = useState(false);

    useEffect(() =>
    {
        const sync = () => setIsGranted(isProductionHost() && getStoredAnalyticsConsent() === "granted");

        sync();
        window.addEventListener(AnalyticsConsentChangedEvent, sync);

        return () => window.removeEventListener(AnalyticsConsentChangedEvent, sync);
    }, []);

    if (!isGranted)
    {
        return null;
    }

    return (
        <>
            <Script
                src={ `https://www.googletagmanager.com/gtag/js?id=${ siteConfig.gaMeasurementId }` }
                strategy="afterInteractive" />
            <Script
                id="ga-init"
                strategy="afterInteractive">
                { `window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag("js", new Date());
                gtag("config", "${ siteConfig.gaMeasurementId }");` }
            </Script>
        </>
    );
};
