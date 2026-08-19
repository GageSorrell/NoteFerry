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

export/** Route-level metadata for `/privacy`. */
const metadata: Metadata = {
    title: "Privacy Policy"
};

/**
 * Renders the Privacy Policy.
 */
export default function PrivacyPage()
{
    return (
        <LegalPageShell
            effectiveDate={ privacyEffectiveDate }
            isPlaceholder={ false }
            sections={ privacySections }
            title="Privacy Policy" />
    );
}
