/**
 * The root layout: HTML shell, the Inter font, theme provider, and the
 * shared navbar/footer chrome around every route.
 *
 * @file      layout.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import "./globals.css";
import type * as React from "react";
import { Footer } from "@/components/site/footer";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { ThemeProvider } from "@/components/site/theme-provider";
import { siteConfig } from "@/content/site-config";

const inter = Inter({
    subsets: [ "latin" ],
    variable: "--font-inter",
    weight: [ "400", "500", "600", "700" ]
});

export/** Site-wide default metadata, inherited by every route. */
const metadata: Metadata = {
    description: siteConfig.description,
    /* No file-based `app/icon.png`/`app/apple-icon.png` — Next resolves
     * file-based icons and this `icons` config independently, and once any
     * `icons` is set here it fully replaces file-based resolution rather
     * than merging with it, so the apple-touch icon needs listing here too
     * or it silently drops out of `<head>`. `apple-icon.png` now lives as a
     * plain `/public` asset for that reason.
     *
     * The `icon` array is what actually needs to be here, since a static
     * file can't carry a `media` query and so can't swap by theme: the light
     * mark is the unconditional default, and the dark-mode `link` only wins
     * when the OS prefers dark, mirroring the navbar `Logo` component's
     * `dark:` swap. */
    icons: {
        apple: "/apple-icon.png",
        icon: [
            { type: "image/svg+xml", url: "/NotivexLogoLight.svg" },
            { media: "(prefers-color-scheme: dark)", type: "image/svg+xml", url: "/NotivexLogoDark.svg" }
        ]
    },
    metadataBase: new URL(siteConfig.canonicalUrl),
    openGraph: {
        description: siteConfig.description,
        siteName: siteConfig.name,
        title: `${ siteConfig.name } — ${ siteConfig.tagline }`,
        type: "website",
        url: siteConfig.canonicalUrl
    },
    title: {
        default: `${ siteConfig.name } — ${ siteConfig.tagline }`,
        template: `%s — ${ siteConfig.name }`
    }
};

/**
 * The root layout component, wrapping every page in the shared HTML shell.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>)
{
    return (
        <html lang="en"
            suppressHydrationWarning>
            <body className={ `${ inter.variable } font-sans antialiased` }>
                <ThemeProvider>
                    <div className="flex min-h-svh flex-col">
                        <Navbar />
                        <main className="flex-1">{ children }</main>
                        <Footer />
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
