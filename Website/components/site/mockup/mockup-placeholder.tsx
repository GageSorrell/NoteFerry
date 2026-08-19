/**
 * The shared "drop your screenshot here" fill used inside both
 * `PhoneFrame` and `BrowserFrame` when no real `src` has been provided
 * yet. Deliberately textured/labeled so it reads as an intentional
 * placeholder rather than a broken image.
 *
 * @file      mockup-placeholder.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Props for {@link MockupPlaceholder}. */
export interface MockupPlaceholderProps
{
    /** A short caption describing what will eventually fill this frame. */
    readonly label?: string;

    /** Extra class names for the fill container. */
    readonly className?: string;
}

/**
 * A textured, labeled fill area used as the "no screenshot yet" state for
 * the device-mockup components. Swap it out by passing a real `src` to
 * `PhoneFrame`/`BrowserFrame` — this component simply stops rendering once
 * that happens. See {@link MockupPlaceholderProps}.
 */
export function MockupPlaceholder({ label, className }: MockupPlaceholderProps)
{
    const stripes = "bg-[repeating-linear-gradient(135deg,var(--color-border)_0,"
        + "var(--color-border)_1px,transparent_1px,transparent_10px)]";

    return (
        <div
            className={ cn(
                "flex size-full flex-col items-center justify-center gap-2 bg-muted",
                stripes,
                className
            ) }>
            <ImageIcon
                className="size-8 text-muted-foreground/50"
                strokeWidth={ 1.5 } />
            { label
                ? (
                    <span className="px-6 text-center text-xs font-medium text-muted-foreground">
                        { label }
                    </span>
                )
                : null }
        </div>
    );
}
