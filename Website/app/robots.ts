/**
 * Generates `/robots.txt` via Next's metadata-route convention.
 *
 * @file      robots.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { MetadataRoute } from "next";
import { siteConfig } from "@/content/site-config";

/**
 * Allows all crawlers and points them at the sitemap.
 */
export default function robots(): MetadataRoute.Robots
{
    return {
        rules: {
            allow: "/",
            userAgent: "*"
        },
        sitemap: `${ siteConfig.canonicalUrl }/sitemap.xml`
    };
}
