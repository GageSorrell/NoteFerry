/**
 * Generates `/sitemap.xml` via Next's metadata-route convention.
 *
 * @file      sitemap.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { MetadataRoute } from "next";
import { siteConfig } from "@/content/site-config";

/**
 * Lists the site's three static routes.
 */
const sitemap = (): MetadataRoute.Sitemap =>
{
    const lastModified = new Date();

    return [ "", "/terms", "/privacy" ].map((path: string) => ({
        lastModified,
        url: `${ siteConfig.canonicalUrl }${ path }`
    }));
};

export default sitemap;
