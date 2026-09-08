/**
 * Minimal OS/platform mark icons for the platforms table
 * (`components/site/sections/platforms.tsx`): Windows, Android, Finder
 * (macOS), a simplified iPhone (iOS), and GitHub. None of these have a
 * ready-made icon in lucide-react — it ships no Windows, Android, or
 * GitHub logo at all, and its one Apple glyph is a generic fruit
 * silhouette rather than either the Finder face (macOS's actual dock/app
 * icon) or a device shape for iOS — so all five are hand-rolled here,
 * matching each other's weight and the row's `size-4` sizing rather than
 * pulling in a whole icon-brand package for five glyphs. This mirrors how
 * `components/ui/android.tsx`/`iphone.tsx` already hand-roll (larger,
 * more detailed) device-frame SVGs elsewhere in this codebase.
 *
 * Windows, Android, the iPhone glyph, and GitHub are flat `currentColor`
 * SVG fills (Windows/GitHub paths adapted from Simple Icons, CC0; the
 * iPhone glyph is original). Finder is the odd one out: it's the actual
 * Flaticon artwork at `public/finder-logo.png` (credited via the
 * footer's "View credits." modal — see `components/site/credits-modal.tsx`),
 * rendered as a `mask-image` so its black linework can still be tinted
 * with `currentColor` like every other icon here, rather than showing
 * fixed black.
 *
 * @file      os-icons.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { cn } from "@/lib/utils";

export/**
       * Props shared by every icon in this file — just enough to size
       * and hide them (`className`, `aria-hidden`), regardless of
       * whether a given icon renders as an `<svg>` or (see
       * {@link FinderIcon}) a masked `<span>`.
       */
interface IconProps
{
    readonly className?: string;

    readonly "aria-hidden"?: boolean;
}

export/**
       * The Windows four-pane flag mark.
       */
const WindowsIcon = (props: IconProps) =>
{
    return (
        <svg
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            { ...props }>
            <path d={ "M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699"
                + "M10.949 12.6H24V24l-13.051-1.351" } />
        </svg>
    );
};

export/**
       * The Android robot-head mark.
       */
const AndroidIcon = (props: IconProps) =>
{
    return (
        <svg
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            { ...props }>
            <path d={ "M17.6 9.48l1.84-3.18a.36.36 0 00-.63-.36l-1.86 3.22a11.4 11.4 0 00-9.9 0L5.19 5.94a.36.36 0 10-.63.36"
                + "L6.4 9.48A10.1 10.1 0 001 18h22a10.1 10.1 0 00-5.4-8.52zM7 15.25a1.25 1.25 0 111.25-1.25A1.25 1.25 0 0"
                + "17 15.25zm10 0a1.25 1.25 0 111.25-1.25A1.25 1.25 0 0117 15.25z" } />
        </svg>
    );
};

export/**
       * The real Finder icon (`public/finder-logo.png`, from Flaticon —
       * see the footer's "View credits." modal), tinted to `currentColor`
       * via `mask-image` rather than shown in its original black. A raster
       * asset can't recolor itself the way the other icons in this file
       * do with `fill="currentColor"`, so this uses the image as an alpha
       * mask over a `bg-current` box instead: wherever the artwork is
       * opaque, the box's `currentColor` background shows through.
       */
const FinderIcon = ({ className, ...props }: IconProps) =>
{
    const maskStyle = {
        WebkitMaskImage: "url(/FinderLogo.png)",
        WebkitMaskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskImage: "url(/FinderLogo.png)",
        maskPosition: "center",
        maskRepeat: "no-repeat",
        maskSize: "contain"
    };

    return (
        <span
            className={ cn("inline-block bg-current", className) }
            style={ maskStyle }
            { ...props } />
    );
};

export/**
       * A simplified iPhone mark: a rounded-rectangle body with a small
       * pill-shaped earpiece slit near the top and a home-indicator bar
       * near the bottom.
       */
const IphoneIcon = (props: IconProps) =>
{
    return (
        <svg
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            { ...props }>
            <path
                clipRule="evenodd"
                d={ "M8.4,2 H15.6 A2.4,2.4 0 0 1 18,4.4 V19.6 A2.4,2.4 0 0 1 15.6,22 H8.4"
                    + "A2.4,2.4 0 0 1 6,19.6 V4.4 A2.4,2.4 0 0 1 8.4,2 Z"
                    + "M10.05,4.2 H13.95 A0.45,0.45 0 0 1 14.4,4.65 A0.45,0.45 0 0 1 13.95,5.1"
                    + "H10.05 A0.45,0.45 0 0 1 9.6,4.65 A0.45,0.45 0 0 1 10.05,4.2 Z" }
                fillRule="evenodd" />
            <rect
                height="1.1"
                rx="0.55"
                width="5"
                x="9.5"
                y="19.4" />
        </svg>
    );
};

export/**
       * The GitHub Octocat mark.
       */
const GithubIcon = (props: IconProps) =>
{
    return (
        <svg
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            { ...props }>
            <path
                d={ "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 "
                    + "0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-"
                    + "1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 "
                    + "1.834 2.807 1.304 3.492.997.107-.775.418-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-"
                    + "5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 "
                    + "1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-"
                    + "1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-"
                    + "5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825."
                    + "57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" } />
        </svg>
    );
};
