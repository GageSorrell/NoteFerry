"use client";

/**
 * Detects whether the visitor's device is Android, so device mockups can
 * show the matching platform's frame.
 *
 * @file      use-is-android.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";

/**
 * Returns whether the visitor's user agent reports an Android device.
 * Always `false` during server rendering and before mount — the server
 * render is platform-agnostic to avoid a hydration mismatch, then this
 * swaps once the real device is known, the same pattern `ThemeToggle`
 * uses for its icon.
 */
export function useIsAndroid(): boolean
{
    const [ isAndroid, setIsAndroid ] = React.useState(false);

    React.useEffect(() =>
    {
        setIsAndroid(/Android/i.test(window.navigator.userAgent));
    }, []);

    return isAndroid;
}
