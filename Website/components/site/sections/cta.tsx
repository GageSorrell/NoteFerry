/**
 * The landing page's closing call-to-action band: a repeat of the store
 * badges so the page has a proper closing beat before the footer.
 *
 * @file      cta.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { StoreBadges } from "@/components/site/store-badges";

export/** The centered closing CTA band. */
const Cta = () =>
{
    return (
        <section className="border-t border-border">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-24 text-center">
                <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                    NoteFerry is here.
                </h2>
                <p className="max-w-md text-base text-muted-foreground">
                    Download it now and capture your first Notion page in seconds.
                </p>
                <StoreBadges className="flex flex-wrap items-center justify-center gap-3" />
            </div>
        </section>
    );
};
