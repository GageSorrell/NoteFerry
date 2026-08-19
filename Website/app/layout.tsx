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
