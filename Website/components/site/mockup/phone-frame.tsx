/**
 * A realistic phone-mockup wrapper around the `Iphone` primitive
 * (`components/ui/iphone`): titanium bezel, Dynamic Island, and a screen
 * area that shows either real media or our labeled placeholder fill.
 *
 * @file      phone-frame.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Iphone } from "@/components/ui/iphone";
import { MockupPlaceholder } from "@/components/site/mockup/mockup-placeholder";

/** Props for {@link PhoneFrame}. */
export interface PhoneFrameProps
{
    /**
     * The screenshot or recording still to fill the screen with. Omit to
     * render the labeled placeholder fill instead — drop a file into
     * `public/screenshots/` and pass its path here once you have real
     * capture art.
     */
    readonly src?: string;

    /** Alt text for `src`. Required whenever `src` is provided. */
    readonly alt?: string;

    /** Caption baked into the placeholder fill (ignored once `src` is set). */
    readonly label?: string;

    /** Extra class names for the outer frame. */
    readonly className?: string;
}

/**
 * A phone-shaped device mockup: rounded bezel, notch, and an inner screen
 * area that either shows `src` or a designed placeholder fill.
 * See {@link PhoneFrameProps}.
 */
export function PhoneFrame({ src, alt, label, className }: PhoneFrameProps)
{
    return (
        <Iphone
            alt={ alt }
            className={ className ?? "w-70 max-w-full drop-shadow-2xl" }
            placeholder={ <MockupPlaceholder label={ label } /> }
            src={ src } />
    );
}
