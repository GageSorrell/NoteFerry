/**
 * Generates the web app manifest via Next's metadata-route convention —
 * basic "add to home screen" branding. NoteFerry's website isn't a PWA
 * (no service worker, no offline support), so this is intentionally
 * minimal.
 *
 * @file      manifest.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { MetadataRoute } from "next";
import { siteConfig } from "@/content/site-config";

/**
 * Describes the site for the browser's "add to home screen" prompt.
 */
const manifest = (): MetadataRoute.Manifest =>
{
    return {
        background_color: "#FFFFFF",
        display: "standalone",
        icons: [
            { sizes: "any", src: "/NoteFerryLogoLight.svg", type: "image/svg+xml" }
        ],
        name: `${ siteConfig.name } — ${ siteConfig.tagline }`,
        short_name: siteConfig.name,
        start_url: "/",
        theme_color: "#2383E2"
    };
};

export default manifest;
