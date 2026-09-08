/**
 * Store badges. NoteFerry hasn't shipped to any of its four target stores
 * yet.
 *
 * The Play Store badge links to a placeholder URL from
 * `content/site-config`'s `storeUrls` — swap it in once the app is
 * published. The other three stores are further along from not-yet-shipped:
 * there's no listing to link to and no submission date to promise, so
 * {@link MicrosoftStoreBadge}, {@link MacAppStoreBadge}, and
 * {@link AppStoreBadge} all render {@link ComingSoonBadge} — an inert,
 * visually-muted stand-in that communicates "not available yet" instead
 * of a live (or worse, dead-`#`) link. Swap each one back to a real link
 * once there's a store listing to send people to.
 *
 * The Play Store artwork itself is Google's own official badge asset
 * (`public/badges/`, downloaded from `play.google.com`), used unmodified
 * per its brand guidelines: original mark, fixed aspect ratio, no
 * recoloring, no added effects. It ships with a large transparent margin
 * baked in (its "clear space" requirement); the local copy has that
 * margin trimmed so it renders at the same visual height as
 * {@link ComingSoonBadge} when both use `h-11`.
 *
 * {@link StoreBadges} only ever shows two of the four badges at a time —
 * Microsoft Store + Play Store, or Mac App Store + App Store — chosen by
 * `platformGroup`. {@link PlatformStoreBadges} picks that group itself
 * from the request's `User-Agent` header (see `lib/platform`), which is
 * what the hero and closing CTA actually render. The full set of four
 * always stays reachable from the platforms table further down the page.
 *
 * @file      store-badges.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Clock } from "lucide-react";
import Image from "next/image";
import { headers } from "next/headers";
import { cn } from "@/lib/utils";
import { detectStorePlatformGroup, type StorePlatformGroup } from "@/lib/platform";
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

/**
 * A store-badge-shaped stand-in used wherever a real store link isn't
 * available yet. Matches the badges' size and pill layout but is
 * inert — no `href`, no click handler — and visually muted so it
 * doesn't read as a working download button. See {@link StoreBadgeProps}.
 */
const ComingSoonBadge = ({ className, storeName }: StoreBadgeProps & { readonly storeName: string }) =>
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
            title={ `Coming soon — ${ storeName }` }>
            <Clock
                aria-hidden
                className="size-5 shrink-0"
                strokeWidth={ 1.75 } />
            <span className="flex flex-col items-start leading-none">
                <span className="text-[10px] tracking-wide">Coming soon</span>
                <span className="text-sm font-semibold">{ storeName }</span>
            </span>
        </span>
    );
};

export/**
       * The Microsoft Store slot in {@link StoreBadges}. See the file
       * header for why this is a {@link ComingSoonBadge} rather than a
       * live link.
       */
const MicrosoftStoreBadge = ({ className }: StoreBadgeProps) =>
{
    return <ComingSoonBadge className={ className } storeName="Microsoft Store" />;
};

export/**
       * The Mac App Store slot in {@link StoreBadges}. See the file
       * header for why this is a {@link ComingSoonBadge} rather than a
       * live link.
       */
const MacAppStoreBadge = ({ className }: StoreBadgeProps) =>
{
    return <ComingSoonBadge className={ className } storeName="Mac App Store" />;
};

export/**
       * The (iOS) App Store slot in {@link StoreBadges}. See the file
       * header for why this is a {@link ComingSoonBadge} rather than a
       * live link.
       */
const AppStoreBadge = ({ className }: StoreBadgeProps) =>
{
    return <ComingSoonBadge className={ className } storeName="App Store" />;
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

/** Props for {@link StoreBadges}. */
export interface StoreBadgesProps extends StoreBadgeProps
{
    /**
     * Which pair of badges to show: `"apple"` for Mac App Store + App
     * Store, `"default"` for Microsoft Store + Play Store. Defaults to
     * `"default"`, matching the landing page's "when unsure" behavior.
     */
    readonly platformGroup?: StorePlatformGroup;
}

export/**
       * One pair of store badges — Microsoft Store + Play Store, or Mac
       * App Store + App Store — picked by `platformGroup`. `className`,
       * if given, applies to the row wrapper — see {@link StoreBadgeProps}.
       * Most callers want {@link PlatformStoreBadges} instead, which picks
       * `platformGroup` itself from the visitor's device.
       */
const StoreBadges = ({ className, platformGroup = "default" }: StoreBadgesProps) =>
{
    return (
        <div className={ className ?? "flex flex-wrap items-center gap-3" }>
            { platformGroup === "apple"
                ? (
                    <>
                        <MacAppStoreBadge />
                        <AppStoreBadge />
                    </>
                )
                : (
                    <>
                        <MicrosoftStoreBadge />
                        <PlayStoreBadge />
                    </>
                ) }
        </div>
    );
};

export/**
       * {@link StoreBadges}, with `platformGroup` chosen automatically
       * from the request's `User-Agent` header: Windows/Android (and
       * anything unrecognized) get Microsoft Store + Play Store; macOS/iOS
       * get Mac App Store + App Store. This is what the hero and closing
       * CTA actually render.
       */
const PlatformStoreBadges = async ({ className }: StoreBadgeProps) =>
{
    const headerList = await headers();
    const platformGroup = detectStorePlatformGroup(headerList.get("user-agent"));

    return <StoreBadges className={ className } platformGroup={ platformGroup } />;
};
