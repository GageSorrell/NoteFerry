/**
 * Ref-merging utility, ported from `@notion-kit/ui`'s
 * `primitives/compose-refs.ts` — the original implementation is already
 * DOM-agnostic (it only touches `React.Ref`, never the DOM directly), so
 * this is a direct port with PascalCase naming.
 *
 * @module @notivex/ui/Utility/ComposeRefs
 * @internal
 *
 * @file      ComposeRefs.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";

type MaybeRef<Type> =
    | React.Ref<Type>
    | undefined;

const SetRef = <Type>(Ref: MaybeRef<Type>, Value: Type): (() => void) | undefined =>
{
    if (typeof Ref === "function")
    {
        const Cleanup = Ref(Value);
        return (typeof Cleanup === "function")
            ? Cleanup
            : (() => Ref(null));
    }
    else if (Ref !== null && Ref !== undefined)
    {
        (Ref as React.RefObject<Type | null>).current = Value;

        return () =>
        {
            (Ref as React.RefObject<Type | null>).current = null;
        };
    }

    return undefined;
};

export/**
       * Merges multiple refs into a single ref callback, calling every provided
       * ref (function or object) with the same node and cleaning each of them up
       * on unmount.
       */
const ComposeRefs = <Type>(...Refs: Array<MaybeRef<Type>>) =>
    (Node: Type): (() => void) | undefined =>
    {
        const Cleanups = Refs.map((Ref: MaybeRef<Type>) => SetRef(Ref, Node));
        const HasCleanup = Cleanups.some((Cleanup?: () => void) => typeof Cleanup === "function");

        if (HasCleanup)
        {
            return () =>
            {
                for (let Index = 0; Index < Cleanups.length; Index++)
                {
                    Cleanups[Index]?.();
                }
            };
        }

        return undefined;
    };

export/**
       * `useComposedRefs(...refs)` — the hook form of `ComposeRefs`, memoized
       * across renders.
       */
const useComposedRefs = <Type>(...Refs: Array<MaybeRef<Type>>): ((Node: Type) => void) =>
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useCallback(ComposeRefs(...Refs), Refs);
