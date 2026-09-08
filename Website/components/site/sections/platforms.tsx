/**
 * The landing page's platform-availability table: every store NoteFerry
 * targets — whether it's live yet or still "coming soon" — plus the
 * GitHub repository, gathered in one place. The hero and closing CTA only
 * ever show two store badges at a time, guessed from the visitor's device
 * (see `components/site/store-badges.tsx`); this section is the anchor
 * target of the hero's "See all supported platforms" link, so anyone can
 * find every download link regardless of what was guessed for them.
 *
 * A row's "Coming soon" vs. "Available" status is derived straight from
 * `storeUrls` in `content/site-config` — swapping a real URL in there is
 * the only change needed to flip a row over once that build ships.
 *
 * @file      platforms.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { AndroidIcon, FinderIcon, GithubIcon, type IconProps, IphoneIcon, WindowsIcon } from "@/components/ui/os-icons";
import { Badge } from "@/components/ui/badge";
import type { ComponentType } from "react";
import { siteConfig, storeUrls } from "@/content/site-config";

/** One row of the platforms table: a target platform, its OS icon, and its store URL. */
interface PlatformRow
{
    readonly platform: string;

    readonly Icon: ComponentType<IconProps>;

    readonly href: string;
}

const platformRows: ReadonlyArray<PlatformRow> = [
    { href: storeUrls.playStore, Icon: AndroidIcon, platform: "Google Play" },
    { href: storeUrls.appStore, Icon: IphoneIcon, platform: "App Store" },
    { href: storeUrls.microsoftStore, Icon: WindowsIcon, platform: "Microsoft Store" },
    { href: storeUrls.macAppStore, Icon: FinderIcon, platform: "App Store (macOS)" }
];

export/**
       * The full store-link table, plus a GitHub repository row, shown
       * near the bottom of the landing page.
       */
const Platforms = () =>
{
    return (
        <section
            className="border-t border-border"
            id="platforms">
            <div className="mx-auto max-w-6xl px-6 py-24">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                        View all platforms
                    </h2>
                    {/* <p className="mt-4 text-base text-muted-foreground">
                        Every place NoteFerry ships, or will ship, in one place.
                    </p> */}
                </div>
                <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-xl border border-border">
                    <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th
                                    className="px-4 py-3 font-medium text-muted-foreground"
                                    scope="col">
                                    Platform
                                </th>
                                <th
                                    className="px-4 py-3 font-medium text-muted-foreground"
                                    scope="col">
                                    Status
                                </th>
                                <th
                                    className="px-4 py-3 font-medium text-muted-foreground"
                                    scope="col">
                                    Link
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            { platformRows.map(({ platform, Icon, href }: PlatformRow) =>
                            {
                                const isAvailable = href !== "#";

                                return (
                                    <tr key={ platform }>
                                        <td className="px-4 py-3 text-foreground">
                                            <span className="inline-flex items-center gap-2">
                                                <Icon
                                                    aria-hidden
                                                    className="size-4 shrink-0 text-muted-foreground" />
                                                { platform }
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={ isAvailable ? "primary" : "default" }>
                                                { isAvailable ? "Available" : "Coming soon" }
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            { isAvailable
                                                ? (
                                                    <a
                                                        className="text-primary underline underline-offset-4 hover:no-underline"
                                                        href={ href }>
                                                        Visit store
                                                    </a>
                                                )
                                                : <span className="text-muted-foreground">—</span> }
                                        </td>
                                    </tr>
                                );
                            }) }
                            <tr>
                                <td className="px-4 py-3 text-foreground">
                                    <span className="inline-flex items-center gap-2">
                                        <GithubIcon
                                            aria-hidden
                                            className="size-4 shrink-0 text-muted-foreground" />
                                        GitHub
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant="outline">Open source</Badge>
                                </td>
                                <td className="px-4 py-3">
                                    <a
                                        className="text-primary underline underline-offset-4 hover:no-underline"
                                        href={ siteConfig.githubRepoUrl }>
                                        View source
                                    </a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};
