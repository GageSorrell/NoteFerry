/**
 * Shared utilities for the Notivex marketing website.
 *
 * @file      utils.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class-name fragments with `clsx`, then resolves conflicting
 * Tailwind utility classes with `tailwind-merge` (shadcn/ui's standard
 * `cn()` helper).
 *
 * @param inputs - Class-name fragments (strings, conditionals, arrays).
 */
export function cn(...inputs: Array<ClassValue>): string
{
    return twMerge(clsx(inputs));
}
