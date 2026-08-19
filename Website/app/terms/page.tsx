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

export/** Route-level metadata for `/terms`. */
const metadata: Metadata = {
    title: "Terms of Service"
};

/**
 * Renders the Terms of Service.
 */
export default function TermsPage()
{
    return (
        <LegalPageShell
            effectiveDate={ termsEffectiveDate }
            isPlaceholder={ false }
            sections={ termsSections }
            title="Terms of Service" />
    );
}
