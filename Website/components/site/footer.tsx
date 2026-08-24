/**
 * The site-wide footer: wordmark, copyright, and legal-page links.
 *
 * @file      footer.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { type NavLink, navLinks, siteConfig } from "@/content/site-config";
import Link from "next/link";
import { Logo } from "@/components/site/logo";

export/**
       * The footer shown at the bottom of every page.
       */
const Footer = () =>
{
    return (
        <footer className="border-t border-border">
            <div
                className={ "mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 "
                    + "sm:flex-row sm:justify-between" }>
                <div className="flex flex-col items-center gap-2 sm:items-start">
                    <Logo />
                    <p className="text-xs text-muted-foreground">
                        © { new Date().getFullYear() } { siteConfig.name }. All rights reserved.
                    </p>
                </div>
                <nav className="flex items-center gap-6">
                    { navLinks.map((link: NavLink) => (
                        <Link
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                            href={ link.href }
                            key={ link.href }>
                            { link.label }
                        </Link>
                    )) }
                    <a
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        href={ siteConfig.githubIssuesUrl }>
                        Contact
                    </a>
                </nav>
            </div>
        </footer>
    );
};
