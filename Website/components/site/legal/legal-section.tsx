/**
 * Renders one {@link LegalSection} (heading + paragraphs) with consistent
 * spacing, used by `legal-page-shell` for every section of the Terms and
 * Privacy pages.
 *
 * @file      legal-section.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { LegalSection as LegalSectionData } from "@/content/legal-section";

/** Props for {@link LegalSectionView}. */
export interface LegalSectionViewProps
{
    /** The section data to render. */
    readonly section: LegalSectionData;
}

export/**
       * One anchor-linked heading followed by its paragraphs.
       * See {@link LegalSectionViewProps}.
       */
const LegalSectionView = ({ section }: LegalSectionViewProps) =>
{
    return (
        <section
            className="scroll-mt-24"
            id={ section.id }>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
                { section.heading }
            </h2>
            <div className="mt-3 flex flex-col gap-3">
                { section.paragraphs.map((paragraph: string, index: number) => (
                    <p
                        className="text-sm leading-relaxed text-muted-foreground"
                        key={ index }>
                        { paragraph }
                    </p>
                )) }
            </div>
        </section>
    );
};
