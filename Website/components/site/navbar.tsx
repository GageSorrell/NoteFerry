/**
 * The site-wide navbar: sticky, translucent on scroll, with just the logo
 * and the theme switch. Legal-page links live in the footer only.
 *
 * @file      navbar.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";

/**
 * The sticky top navigation bar shown on every page.
 */
export function Navbar()
{
    return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                <div className="flex items-center gap-2">
                    <Logo />
                    <a
                        className={ "text-xs text-muted-foreground no-underline "
                            + "transition-colors hover:text-foreground" }
                        href="https://sorrell.sh"
                        style={ { marginBottom: -3 } }>
                        a Sorrell application
                    </a>
                </div>
                <ThemeToggle />
            </div>
        </header>
    );
}
