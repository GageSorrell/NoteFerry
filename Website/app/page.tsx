/**
 * The Notivex marketing landing page.
 *
 * @file      page.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Cta } from "@/components/site/sections/cta";
import { Hero } from "@/components/site/sections/hero";
import { HowItWorks } from "@/components/site/sections/how-it-works";
import { Showcase } from "@/components/site/sections/showcase";

/**
 * Composes the landing page's sections in order.
 */
export default function HomePage()
{
    return (
        <>
            <Hero />
            <HowItWorks />
            <Showcase />
            <Cta />
        </>
    );
}
