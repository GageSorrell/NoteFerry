/**
 * Converts a cached template's (or data source's) Notion icon fields into
 * `@notivex/ui`'s `IconData`, so template rows always render through
 * `IconBlock` — including its `Muted` treatment for the hidden-templates
 * list — rather than `DatabaseCard.tsx`'s more ad-hoc per-type rendering,
 * which only routes the "Native" case through `IconBlock`.
 *
 * @module notivex/features/templates/template-icon
 *
 * @file      template-icon.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { IconData } from "@notivex/ui/Block";
import { ToLucideIconName } from "@/Domain/Utility/DatabaseIcon";

const IsImageUrl = (Value: string): boolean =>
    Value.startsWith("https://") || Value.startsWith("http://");

/**
 * Resolves a template's `Icon`/`IconType` into `IconData`, falling back to a
 * generic document icon when Notion supplied none.
 *
 * @category Templates
 * @since 1.0.0
 */
export function ResolveTemplateIconData(
    Icon: string | undefined,
    IconType: "Emoji" | "Image" | "Native" | undefined
): IconData
{
    if (!Icon)
    {
        return { Src: "file-text", Type: "Lucide" };
    }

    if (IconType === "Native")
    {
        return { Src: ToLucideIconName(Icon), Type: "Lucide" };
    }

    if (IconType === "Image" || IsImageUrl(Icon))
    {
        return { Src: Icon, Type: "Url" };
    }

    return { Src: Icon, Type: "Emoji" };
}
