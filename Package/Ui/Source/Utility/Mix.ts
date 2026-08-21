/**
 * Blends two resolved token colors (`rgb()`, `rgba()`, or `#RRGGBB`/`#RGB`
 * hex) into a single **opaque** `rgb()` string. Unlike {@link WithAlpha}, the
 * result has no transparency, so it will not compound with anything painted
 * behind it — needed where a translucent fill would otherwise stack with a
 * layer below and read as two different shades.
 *
 * @module @notivex/ui/Utility/Mix
 * @internal
 *
 * @file      Mix.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { String } from "effect";

const ParseColor = (Value: string): readonly [ number, number, number ] | undefined =>
{
    const Trimmed = Value.trim();

    if (Trimmed.startsWith("#"))
    {
        const Normalized = Trimmed.replace("#", "");
        const Full = Normalized.length === 3
            ? Normalized.split("").map((Character: string) => Character + Character).join("")
            : Normalized;

        if (Full.length !== 6)
        {
            return undefined;
        }

        return [
            Number.parseInt(Full.slice(0, 2), 16),
            Number.parseInt(Full.slice(2, 4), 16),
            Number.parseInt(Full.slice(4, 6), 16)
        ];
    }

    const Match = /^rgba?\(([^)]+)\)$/iu.exec(Trimmed);

    if (!Match)
    {
        return undefined;
    }

    const [ RPart, GPart, BPart ] = Match[ 1 ]!.split(",").map(String.trim);

    return [
        Number.parseFloat(RPart ?? "0"),
        Number.parseFloat(GPart ?? "0"),
        Number.parseFloat(BPart ?? "0")
    ];
};

export/**
       * Blend `ColorA` toward `ColorB` by `Ratio` (on ${0..1}$), returning an
       * opaque `rgb()` string. `Ratio` `0` yields `ColorA`; `1` yields `ColorB`.
       *
       * @category Theme
       * @since 1.0.0
       */
const Mix = (ColorA: string, ColorB: string, Ratio: number): string =>
{
    const A = ParseColor(ColorA);
    const B = ParseColor(ColorB);

    if (!A || !B)
    {
        return ColorB.trim();
    }

    const T = Math.min(1, Math.max(0, Ratio));
    const Blend = (Index: number): number =>
        Math.round((A[ Index ] ?? 0) * (1 - T) + (B[ Index ] ?? 0) * T);

    return `rgb(${ Blend(0) }, ${ Blend(1) }, ${ Blend(2) })`;
};

export/**
       * {@link Mix}'s inverse: given a starting color, a target color, and a
       * result presumed to be `Mix(ColorA, ColorTarget, ratio)` for some
       * `ratio`, solves for that `ratio` (averaged across channels, clamped
       * to ${0..1}$). Useful for deriving a blend strength from two design
       * tokens that already encode it — e.g. how far a theme's muted text
       * color sits from its primary text color, toward gray — rather than
       * hardcoding the number.
       *
       * @category Theme
       * @since 1.0.0
       */
const Unmix = (ColorA: string, ColorTarget: string, Result: string): number =>
{
    const A = ParseColor(ColorA);
    const Target = ParseColor(ColorTarget);
    const R = ParseColor(Result);

    if (!A || !Target || !R)
    {
        return 0;
    }

    const Ratios: Array<number> = [];

    for (let Index = 0; Index < 3; Index += 1)
    {
        const Span = (Target[ Index ] ?? 0) - (A[ Index ] ?? 0);

        if (Span !== 0)
        {
            Ratios.push(((R[ Index ] ?? 0) - (A[ Index ] ?? 0)) / Span);
        }
    }

    if (Ratios.length === 0)
    {
        return 0;
    }

    const Average = Ratios.reduce((Sum: number, Value: number) => Sum + Value, 0) / Ratios.length;

    return Math.min(1, Math.max(0, Average));
};
