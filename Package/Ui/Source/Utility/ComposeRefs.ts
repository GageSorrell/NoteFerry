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

type MaybeRef<A> =
    | React.Ref<A>
    | undefined;

const SetRef = <A>(Ref: MaybeRef<A>, Value: A): (() => void) | undefined =>
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
        (Ref as React.RefObject<A | null>).current = Value;

        return () =>
        {
            (Ref as React.RefObject<A | null>).current = null;
        };
    }

    return undefined;
};

export/**
       * Merges multiple refs into a single ref callback, calling every provided
       * ref (function or object) with the same node and cleaning each of them up
       * on unmount.
       *
       * @category Utility
       * @since 1.0.0
       */
const ComposeRefs = <A>(...Refs: Array<MaybeRef<A>>) =>
    (Node: A): (() => void) | undefined =>
    {
        const Cleanups = Refs.map((Ref: MaybeRef<A>) => SetRef(Ref, Node));
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
       *
       * @category Utility
       * @since 1.0.0
       */
const useComposedRefs = <A>(...Refs: Array<MaybeRef<A>>): ((Node: A) => void) =>
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useCallback(ComposeRefs(...Refs), Refs);
