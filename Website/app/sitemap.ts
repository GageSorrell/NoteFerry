/**
 * Generates `/sitemap.xml` via Next's metadata-route convention.
 *
 * @file      sitemap.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { MetadataRoute } from "next";
import { privacyEffectiveDate } from "@/content/privacy-content";
import { siteConfig } from "@/content/site-config";
import { termsEffectiveDate } from "@/content/terms-content";

/**
 * One static route paired with the real date its content was last
 * meaningfully changed — bump the date by hand when that route's content
 * changes, rather than stamping every route with the build/request time.
 * `/terms` and `/privacy` reuse their own effective-date constants so they
 * can't drift out of sync with the pages themselves.
 */
interface SitemapRoute
{
    readonly path: string;
    readonly lastModified: Date;
}

const routes: ReadonlyArray<SitemapRoute> = [
    { lastModified: new Date("2026-09-08"), path: "" },
    { lastModified: new Date(termsEffectiveDate), path: "/terms" },
    { lastModified: new Date(privacyEffectiveDate), path: "/privacy" },
    { lastModified: new Date("2026-09-08"), path: "/delete-account" }
];

/**
 * Lists the site's four static routes.
 */
const sitemap = (): MetadataRoute.Sitemap =>
{
    return routes.map(({ lastModified, path }) => ({
        lastModified,
        url: `${ siteConfig.canonicalUrl }${ path }`
    }));
};

export default sitemap;
