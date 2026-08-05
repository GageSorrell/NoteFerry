/**
 * Applies an alpha channel to a resolved token color string (`rgb()`,
 * `rgba()`, or `#RRGGBB`/`#RGB` hex), returning an `rgba()` string RN can
 * use directly. Needed because `@notion-kit/ui` leans heavily on Tailwind's
 * `bg-blue/10`-style opacity modifiers, which have no RN equivalent — the
 * resolved token value has to be blended by hand instead.
 *
 * @module @notivex/ui/Utility/WithAlpha
 * @internal
 *
 * @file      WithAlpha.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

const ParseHex = (Hex: string): readonly [ number, number, number ] | undefined =>
{
    const Normalized = Hex.replace("#", "");
    const Full = Normalized.length === 3
        ? Normalized.split("").map((Character) => Character + Character).join("")
        : Normalized;

    if (Full.length !== 6)
    {
        return undefined;
    }

    const R = Number.parseInt(Full.slice(0, 2), 16);
    const G = Number.parseInt(Full.slice(2, 4), 16);
    const B = Number.parseInt(Full.slice(4, 6), 16);

    return [ R, G, B ];
};

const ParseRgb = (Value: string): readonly [ number, number, number ] | undefined =>
{
    const Match = /^rgba?\(([^)]+)\)$/i.exec(Value.trim());

    if (!Match)
    {
        return undefined;
    }

    const [ RPart, GPart, BPart ] = Match[ 1 ]!.split(",").map((Part) => Part.trim());
    const R = Number.parseFloat(RPart ?? "0");
    const G = Number.parseFloat(GPart ?? "0");
    const B = Number.parseFloat(BPart ?? "0");

    return [ R, G, B ];
};

export const WithAlpha = (Value: string, Alpha: number): string =>
{
    const Trimmed = Value.trim();
    const Components = Trimmed.startsWith("#") ? ParseHex(Trimmed) : ParseRgb(Trimmed);

    if (!Components)
    {
        return Trimmed;
    }

    const [ R, G, B ] = Components;

    return `rgba(${ R }, ${ G }, ${ B }, ${ Alpha })`;
};
