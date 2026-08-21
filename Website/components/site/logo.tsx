/**
 * The Notivex wordmark, swapping the light/dark logo art via CSS
 * (`dark:` classes) rather than JS state, so it renders correctly on the
 * very first paint with no theme-detection flicker.
 *
 * @file      logo.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Props for {@link Logo}. */
export interface LogoProps
{
    /** Whether to show the "Notivex" wordmark next to the mark. Defaults to `true`. */
    readonly showWordmark?: boolean;

    /** Extra class names for the wrapping link. */
    readonly className?: string;
}

/**
 * The Notivex logo mark, optionally paired with the wordmark, linking home.
 * See {@link LogoProps}.
 */
export function Logo({ showWordmark = true, className }: LogoProps)
{
    return (
        <Link className={ cn("flex items-center gap-2", className) }
            href="/">
            <span className="relative block size-7 overflow-hidden rounded-lg">
                <Image
                    alt="Notivex"
                    className="object-contain dark:hidden"
                    fill
                    priority
                    src="/NotivexLogoLight.svg"
                    unoptimized />
                <Image
                    alt="Notivex"
                    className="hidden object-contain dark:block"
                    fill
                    priority
                    src="/NotivexLogoDark.svg"
                    unoptimized />
            </span>
            { showWordmark
                ? <span className="text-sm font-semibold tracking-tight text-foreground">Notivex</span>
                : null }
        </Link>
    );
}
