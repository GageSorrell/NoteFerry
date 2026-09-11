/**
 * The `/privacy` route.
 *
 * @file      page.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { privacyEffectiveDate, privacySections } from "@/content/privacy-content";
import { LegalPageShell } from "@/components/site/legal/legal-page-shell";
import type { Metadata } from "next";
import { siteConfig } from "@/content/site-config";

export/** Route-level metadata for `/privacy`. */
const metadata: Metadata = {
    alternates: { canonical: `${ siteConfig.canonicalUrl }/privacy` },
    title: "Privacy Policy"
};

/**
 * Renders the Privacy Policy.
 */
const PrivacyPage = () =>
{
    return (
        <LegalPageShell
            effectiveDate={ privacyEffectiveDate }
            isPlaceholder={ false }
            sections={ privacySections }
            title="Privacy Policy" />
    );
};

export default PrivacyPage;
