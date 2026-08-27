/**
 * Store badges. NoteFerry hasn't shipped to either store yet.
 *
 * The Play Store badge links to a placeholder URL from
 * `content/site-config`'s `storeUrls` — swap it in once the app is
 * published. The App Store badge is further along from not-yet-shipped:
 * there's no listing to link to and no submission date to promise, so
 * {@link AppStoreBadge} renders {@link ComingSoonBadge} — an inert,
 * visually-muted stand-in that communicates "not available yet" instead
 * of a live (or worse, dead-`#`) link. Swap it back to a real link once
 * there's a store listing to send people to.
 *
 * The Play Store artwork itself is Google's own official badge asset
 * (`public/badges/`, downloaded from `play.google.com`), used unmodified
 * per its brand guidelines: original mark, fixed aspect ratio, no
 * recoloring, no added effects. It ships with a large transparent margin
 * baked in (its "clear space" requirement); the local copy has that
 * margin trimmed so it renders at the same visual height as
 * {@link ComingSoonBadge} when both use `h-11`.
 *
 * @file      store-badges.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Clock } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { storeUrls } from "@/content/site-config";

/**
 * Props shared across the badge components. `className` means the badge's
 * own size on {@link ComingSoonBadge}/{@link PlayStoreBadge} (default
 * `h-11 w-auto`), and the row wrapper's layout on {@link StoreBadges}.
 */
export interface StoreBadgeProps
{
    readonly className?: string;
}

export/**
       * A store-badge-shaped stand-in used wherever a real store link isn't
       * available yet. Matches the badges' size and pill layout but is
       * inert — no `href`, no click handler — and visually muted so it
       * doesn't read as a working download button. See {@link StoreBadgeProps}.
       */
const ComingSoonBadge = ({ className }: StoreBadgeProps) =>
{
    const size = className ?? "h-11 w-auto";

    return (
        <span
            aria-disabled="true"
            className={ cn(
                "inline-flex select-none items-center gap-2 rounded-xl border "
                + "border-dashed border-border bg-muted px-4 text-muted-foreground",
                size
            ) }
            role="note"
            title="Not available yet">
            <Clock
                aria-hidden
                className="size-5 shrink-0"
                strokeWidth={ 1.75 } />
            <span className="flex flex-col items-start leading-none">
                <span className="text-[10px] tracking-wide">Coming soon</span>
                <span className="text-sm font-semibold">to the App Store</span>
            </span>
        </span>
    );
};

export/**
       * Alias for {@link ComingSoonBadge} — the App Store slot in
       * {@link StoreBadges} and anywhere else an Apple download button used
       * to live. See the file header for why.
       */
const AppStoreBadge = ComingSoonBadge;

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
