/**
 * Owns one shared `KatexInlineRasterizer` instance per screen, plus the
 * result cache and pending-request queue that de-duplicate rasterization
 * across every `InlineEquationRenderer` on that screen -- so scrolling past
 * or re-rendering a repeated inline equation never re-triggers work.
 *
 * @module noteferry/Component/Equation/EquationRasterizerProvider
 *
 * @file      EquationRasterizerProvider.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import KatexInlineRasterizer from "./KatexInlineRasterizer";

/** A rasterized inline equation, or a record that rasterizing it failed. */
export type EquationRasterizerEntry =
    | { readonly Status: "ready"; readonly Uri: string; readonly Width: number; readonly Height: number }
    | { readonly Status: "error" };

interface EquationRasterizerContextValue
{
    readonly Cache: ReadonlyMap<string, EquationRasterizerEntry>;
    readonly RequestRasterization: (Expression: string) => void;
}

const EquationRasterizerContext = createContext<EquationRasterizerContextValue | null>(null);

/** Caps how many rasterized results a single screen keeps around at once. */
const MaxCacheEntries = 200;

const CapCache = (Cache: Map<string, EquationRasterizerEntry>): Map<string, EquationRasterizerEntry> =>
{
    const Overflow = Cache.size - MaxCacheEntries;
    if (Overflow <= 0)
    {
        return Cache;
    }

    const Keys = Cache.keys();
    for (let Index = 0; Index < Overflow; Index += 1)
    {
        const Next = Keys.next();
        if (!Next.done)
        {
            Cache.delete(Next.value);
        }
    }
    return Cache;
};

export/**
       * Provides `useEquationRasterizer` to its subtree and mounts the one
       * hidden worker WebView that services every request from it.
       *
       * @category Components
       * @since 1.0.0
       */
const EquationRasterizerProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element =>
{
    const [ Cache, SetCache ] = useState<ReadonlyMap<string, EquationRasterizerEntry>>(new Map());
    const [ Pending, SetPending ] = useState<readonly string[]>([]);
    // Mirrored into a ref (rather than read directly) so `RequestRasterization`
    // below can stay referentially stable across renders while still seeing
    // the latest committed `Cache` -- it's called from consumers' effects,
    // never during another component's render, so reading one commit behind
    // is fine.
    const CacheRef = useRef(Cache);
    useEffect(() =>
    {
        CacheRef.current = Cache;
    }, [ Cache ]);

    const RequestRasterization = useCallback((Expression: string): void =>
    {
        if (CacheRef.current.has(Expression))
        {
            return;
        }
        SetPending((Previous) => (Previous.includes(Expression) ? Previous : [ ...Previous, Expression ]));
    }, []);

    const HandleResult = useCallback((Expression: string, Uri: string, Width: number, Height: number): void =>
    {
        SetCache((Previous) => CapCache(new Map(Previous).set(Expression, { Height, Status: "ready", Uri, Width })));
        SetPending((Previous) => Previous.filter((Item) => Item !== Expression));
    }, []);

    const HandleResultError = useCallback((Expression: string): void =>
    {
        SetCache((Previous) => CapCache(new Map(Previous).set(Expression, { Status: "error" })));
        SetPending((Previous) => Previous.filter((Item) => Item !== Expression));
    }, []);

    const ContextValue = useMemo<EquationRasterizerContextValue>(
        () => ({ Cache, RequestRasterization }),
        [ Cache, RequestRasterization ]
    );

    return (
        <EquationRasterizerContext.Provider value={ ContextValue }>
            { children }
            <View pointerEvents="none" style={ Styles.HiddenHost }>
                <KatexInlineRasterizer
                    OnResult={ HandleResult }
                    OnResultError={ HandleResultError }
                    PendingExpressions={ Pending }
                    dom={ { style: { width: 1, height: 1 } } } />
            </View>
        </EquationRasterizerContext.Provider>
    );
};

export/**
       * Reads the shared rasterization cache and request function from the
       * nearest `EquationRasterizerProvider`. Throws if none is mounted,
       * since a misconfigured tree should fail loudly rather than silently
       * never rasterize anything.
       *
       * @category Hooks
       * @since 1.0.0
       */
const useEquationRasterizer = (): EquationRasterizerContextValue =>
{
    const Value = useContext(EquationRasterizerContext);
    if (!Value)
    {
        throw new Error("useEquationRasterizer must be used within an EquationRasterizerProvider");
    }
    return Value;
};

const Styles = StyleSheet.create({
    HiddenHost: {
        position: "absolute",
        width: 1,
        height: 1,
        opacity: 0
    }
});
