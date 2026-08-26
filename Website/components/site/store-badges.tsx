/**
 * Official App Store / Play Store badges. NoteFerry hasn't shipped to either
 * store yet, so both link to placeholder URLs from `content/site-config`'s
 * `storeUrls` — swap those in once the app is published.
 *
 * The artwork itself is Apple's and Google's own official badge assets
 * (`public/badges/`, downloaded from their marketing-tools endpoints —
 * `toolbox.marketingtools.apple.com` and `play.google.com`), used
 * unmodified per their respective brand guidelines: original mark, fixed
 * aspect ratio, no recoloring, no added effects. Apple's SVG has no
 * internal padding, but Google's PNG ships with a large transparent
 * margin baked in (its "clear space" requirement); the local copy has
 * that transparent margin trimmed so the two marks render at the same
 * visual height when both use `h-11` — equivalent clear space comes from
 * the row's `gap-3` instead.
 *
 * @file      store-badges.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import Image from "next/image";
import { storeUrls } from "@/content/site-config";

/**
 * Props shared across the badge components. `className` means the badge's
 * own size on {@link AppStoreBadge}/{@link PlayStoreBadge} (default
 * `h-11 w-auto`), and the row wrapper's layout on {@link StoreBadges}.
 */
export interface StoreBadgeProps
{
    readonly className?: string;
}

export/**
       * The official "Download on the App Store" badge, swapping Apple's black
       * and white artwork by theme. See {@link StoreBadgeProps}.
       */
const AppStoreBadge = ({ className }: StoreBadgeProps) =>
{
    const size = className ?? "h-11 w-auto";

    return (
        <a
            aria-label="Download on the App Store"
            href={ storeUrls.appStore }>
            <Image
                alt=""
                className={ `${ size } dark:hidden` }
                height={ 40 }
                src="/badges/app-store-badge-black.svg"
                width={ 120 } />
            <Image
                alt=""
                className={ `${ size } hidden dark:block` }
                height={ 40 }
                src="/badges/app-store-badge-white.svg"
                width={ 120 } />
        </a>
    );
};

export/**
       * The official "Get it on Google Play" badge. See {@link StoreBadgeProps}.
       */
const PlayStoreBadge = ({ className }: StoreBadgeProps) =>
{
    return (
        <a
            aria-label="Get it on Google Play"
            href={ storeUrls.playStore }>
            <Image
                alt=""
                className={ className ?? "h-11 w-auto" }
                height={ 168 }
                src="/badges/google-play-badge.png"
                width={ 564 } />
        </a>
    );
};

export/**
       * Both store badges together, in a wrapping row. `className`, if given,
       * applies to the row wrapper — see {@link StoreBadgeProps}.
       */
const StoreBadges = ({ className }: StoreBadgeProps) =>
{
    return (
        <div className={ className ?? "flex flex-wrap items-center gap-3" }>
            <AppStoreBadge />
            <PlayStoreBadge />
        </div>
    );
};
