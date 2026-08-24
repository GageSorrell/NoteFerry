"use client";

/**
 * A realistic phone-mockup wrapper that picks between the `Iphone` and
 * `Android` primitives (`components/ui/iphone`, `components/ui/android`)
 * based on the visitor's actual device, via `useIsAndroid`. Both
 * primitives share the same `src`/`videoSrc`/`alt`/`placeholder` shape,
 * so this is just a swap, not two separate render paths.
 *
 * @file      phone-frame.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Android } from "@/components/ui/android";
import { Iphone } from "@/components/ui/iphone";
import { MockupPlaceholder } from "@/components/site/mockup/mockup-placeholder";
import { useIsAndroid } from "@/hooks/use-is-android";

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

export/**
       * A phone-shaped device mockup: rounded bezel, notch or camera cutout,
       * and an inner screen area that either shows `src` or a designed
       * placeholder fill. Renders an iPhone frame by default and swaps to the
       * Android frame once the visitor's device is detected as Android — the
       * server render always shows the iPhone frame to avoid a hydration
       * mismatch, then swaps client-side after mount if needed.
       * See {@link PhoneFrameProps}.
       */
const PhoneFrame = ({ src, alt, label, className }: PhoneFrameProps) =>
{
    const isAndroid = useIsAndroid();
    const Frame = isAndroid ? Android : Iphone;

    return (
        <Frame
            alt={ alt }
            className={ className ?? "w-70 max-w-full drop-shadow-2xl" }
            placeholder={ <MockupPlaceholder label={ label } /> }
            src={ src } />
    );
};
