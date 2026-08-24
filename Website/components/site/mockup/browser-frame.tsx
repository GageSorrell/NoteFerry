/**
 * A reusable browser-chrome device mockup, built entirely from CSS. Kept
 * in the component library alongside `PhoneFrame` even though the current
 * landing page leans phone-first — it's a natural fit for a future
 * screenshot of, e.g., the Notion OAuth consent screen.
 *
 * @file      browser-frame.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import Image from "next/image";
import { MockupPlaceholder } from "@/components/site/mockup/mockup-placeholder";
import { cn } from "@/lib/utils";

/** Props for {@link BrowserFrame}. */
export interface BrowserFrameProps
{
    /** The screenshot to fill the browser body with. Omit for a placeholder. */
    readonly src?: string;

    /** Alt text for `src`. Required whenever `src` is provided. */
    readonly alt?: string;

    /** Caption baked into the placeholder fill (ignored once `src` is set). */
    readonly label?: string;

    /** The fake address-bar text. Defaults to the site's canonical domain. */
    readonly url?: string;

    /** Extra class names for the outer chrome. */
    readonly className?: string;
}

export/**
       * A browser-shaped device mockup: a top chrome bar with traffic-light dots
       * and a fake URL pill, and a body that either shows `src` or a designed
       * placeholder fill. See {@link BrowserFrameProps}.
       */
const BrowserFrame = ({
    src,
    alt,
    label,
    url = "notivex.sorrell.sh",
    className
}: BrowserFrameProps) =>
{
    return (
        <div
            className={ cn(
                "w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm",
                className
            ) }>
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <div className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                    <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                    <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                </div>
                <div
                    className={ "flex-1 rounded-full bg-muted px-3 py-1 text-center text-xs "
                        + "text-muted-foreground" }>
                    { url }
                </div>
            </div>
            <div className="relative aspect-video w-full">
                { src
                    ? (
                        <Image
                            alt={ alt ?? "" }
                            className="object-cover"
                            fill
                            src={ src } />
                    )
                    : <MockupPlaceholder label={ label } /> }
            </div>
        </div>
    );
};
