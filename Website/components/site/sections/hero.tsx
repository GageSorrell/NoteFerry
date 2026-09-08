/**
 * The landing page's hero section: headline, subheadline, store-badge
 * CTAs, and a large phone-mockup placeholder.
 *
 * @file      hero.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { ArrowRight } from "lucide-react";
import { PhoneFrame } from "@/components/site/mockup/phone-frame";
import { PlatformStoreBadges } from "@/components/site/store-badges";
import { siteConfig } from "@/content/site-config";

export/**
       * The above-the-fold hero section.
       */
const Hero = () =>
{
    const layout = "flex-col items-center gap-16 px-6 pb-24 pt-16 sm:pt-24 "
        + "lg:flex-row lg:items-center lg:gap-12 lg:pb-32 lg:pt-32";
    const ctaLayout = "mt-10 flex flex-wrap items-center justify-center gap-3 "
        + "lg:justify-start";

    return (
        <section className={ `mx-auto flex max-w-6xl ${ layout }` }>
            <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
                <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
                    { siteConfig.tagline }
                </h1>
                <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                    { siteConfig.description }
                </p>
                <PlatformStoreBadges className={ ctaLayout } />
                <a
                    className={ "mt-4 inline text-sm text-muted-foreground underline "
                        + "underline-offset-4 transition-colors hover:text-foreground" }
                    href="#platforms">
                    All platforms
                    <ArrowRight
                        aria-hidden
                        className="ml-1 inline size-4 align-middle" />
                </a>
            </div>
            <div className="flex flex-1 justify-center">
                <PhoneFrame label="Quick-entry screen" />
            </div>
        </section>
    );
};
