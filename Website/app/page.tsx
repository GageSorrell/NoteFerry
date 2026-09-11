/**
 * The NoteFerry marketing landing page.
 *
 * @file      page.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Cta } from "@/components/site/sections/cta";
import { Hero } from "@/components/site/sections/hero";
import { HowItWorks } from "@/components/site/sections/how-it-works";
import type { Metadata } from "next";
import { Platforms } from "@/components/site/sections/platforms";
import { Showcase } from "@/components/site/sections/showcase";
import { siteConfig } from "@/content/site-config";

export/** Route-level metadata for `/`. */
const metadata: Metadata = {
    alternates: { canonical: siteConfig.canonicalUrl }
};

/* `Organization` and `WebSite` only — no `SoftwareApplication` entry yet,
 * since NoteFerry hasn't shipped to any store (`storeUrls` in
 * `site-config.ts` are still placeholders); adding availability/offer
 * structured data before there's a real listing would misrepresent it. */
const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            logo: `${ siteConfig.canonicalUrl }/apple-icon.png`,
            name: siteConfig.name,
            url: siteConfig.canonicalUrl
        },
        {
            "@type": "WebSite",
            name: siteConfig.name,
            url: siteConfig.canonicalUrl
        }
    ]
};

/**
 * Composes the landing page's sections in order.
 */
const HomePage = () =>
{
    return (
        <>
            <script
                dangerouslySetInnerHTML={ { __html: JSON.stringify(structuredData) } }
                type="application/ld+json" />
            <Hero />
            <HowItWorks />
            <Showcase />
            <Cta />
            <Platforms />
        </>
    );
};

export default HomePage;
