/**
 * Shared layout for the `/terms` and `/privacy` pages: title, placeholder
 * banner, effective-date line, a table of contents generated from the
 * section list, and the rendered sections themselves.
 *
 * @file      legal-page-shell.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Badge } from "@/components/ui/badge";
import type { LegalSection } from "@/content/legal-section";
import { LegalSectionView } from "@/components/site/legal/legal-section";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

/** Props for {@link LegalPageShell}. */
export interface LegalPageShellProps
{
    /** The page title (e.g. "Terms of Service"). */
    readonly title: string;

    /** The effective-date line shown under the title. */
    readonly effectiveDate: string;

    /** The ordered sections to render. */
    readonly sections: ReadonlyArray<LegalSection>;

    /**
     * Shows the "Placeholder legal content" banner. Defaults to `true` —
     * pass `false` once a page's content is final, not scaffolding.
     */
    readonly isPlaceholder?: boolean;
}

export/**
       * The shared Terms/Privacy page layout. See {@link LegalPageShellProps}.
       */
const LegalPageShell = ({
    title,
    effectiveDate,
    sections,
    isPlaceholder = true
}: LegalPageShellProps) =>
{
    return (
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
            { isPlaceholder
                ? <Badge variant="warning">Placeholder legal content — replace before launch</Badge>
                : null }
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                { title }
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Effective date: { effectiveDate }</p>

            <Separator className="my-10" />

            <nav aria-label="Table of contents"
                className="mb-12 rounded-xl border border-border bg-muted/50 p-6">
                <p
                    className={ "mb-3 text-xs font-medium uppercase tracking-wide "
                        + "text-muted-foreground" }>
                    Contents
                </p>
                <ol className="grid gap-2 sm:grid-cols-2">
                    { sections.map((section: LegalSection) => (
                        <li key={ section.id }>
                            <Link
                                className={ "text-sm text-muted-foreground transition-colors "
                                    + "hover:text-foreground" }
                                href={ `#${ section.id }` }>
                                { section.heading }
                            </Link>
                        </li>
                    )) }
                </ol>
            </nav>

            <div className="flex flex-col gap-10">
                { sections.map((section: LegalSection) => (
                    <LegalSectionView
                        key={ section.id }
                        section={ section } />
                )) }
            </div>
        </div>
    );
};
