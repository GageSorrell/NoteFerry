/**
 * The shared shape used by both the Terms of Service and Privacy Policy
 * content files, rendered through `components/site/legal/legal-page-shell`.
 *
 * @file      legal-section.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** One numbered section of a legal document. */
export interface LegalSection
{
    /** A URL-safe anchor id, used for the table of contents and deep links. */
    readonly id: string;

    /** The section's heading. */
    readonly heading: string;

    /** One or more paragraphs of body copy. */
    readonly paragraphs: ReadonlyArray<string>;
}
