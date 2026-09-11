/**
 * The `/terms` route.
 *
 * @file      page.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { termsEffectiveDate, termsSections } from "@/content/terms-content";
import { LegalPageShell } from "@/components/site/legal/legal-page-shell";
import type { Metadata } from "next";
import { siteConfig } from "@/content/site-config";

export/** Route-level metadata for `/terms`. */
const metadata: Metadata = {
    alternates: { canonical: `${ siteConfig.canonicalUrl }/terms` },
    title: "Terms of Service"
};

/**
 * Renders the Terms of Service.
 */
const TermsPage = () =>
{
    return (
        <LegalPageShell
            effectiveDate={ termsEffectiveDate }
            isPlaceholder={ false }
            sections={ termsSections }
            title="Terms of Service" />
    );
};

export default TermsPage;
