/**
 * The landing page's showcase section: additional phone-mockup
 * placeholders with captions, for screens beyond the hero's quick-entry
 * shot.
 *
 * @file      showcase.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { PhoneFrame } from "@/components/site/mockup/phone-frame";

/** One showcased screen: a mockup label plus its caption. */
interface ShowcaseItem
{
    readonly label: string;

    readonly caption: string;
}

const showcaseItems: ReadonlyArray<ShowcaseItem> = [
    {
        caption: "Configure which fields are visible and required per database.",
        label: "Destination settings"
    },
    {
        caption: "Browse and cache the Notion databases you use most.",
        label: "Data source browser"
    }
];

export/**
       * A row of additional device-mockup placeholders with captions.
       */
const Showcase = () =>
{
    return (
        <section className="border-t border-border bg-muted/40 py-24">
            <div className="mx-auto max-w-6xl px-6">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                        See it in action
                    </h2>
                    <p className="mt-4 text-base text-muted-foreground">
                        Real screenshots land here once the app ships — for now, a preview of the flow.
                    </p>
                </div>
                <div className="mt-16 flex flex-wrap items-start justify-center gap-12">
                    { showcaseItems.map((item: ShowcaseItem) => (
                        <div
                            className="flex flex-col items-center gap-4"
                            key={ item.label }>
                            <PhoneFrame label={ item.label } />
                            <p className="max-w-56 text-center text-sm text-muted-foreground">
                                { item.caption }
                            </p>
                        </div>
                    )) }
                </div>
            </div>
        </section>
    );
};
