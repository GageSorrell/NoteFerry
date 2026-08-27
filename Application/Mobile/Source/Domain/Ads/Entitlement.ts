/**
 * Reactive ad eligibility. Unresolved billing state always suppresses ads.
 *
 * @module noteferry/Domain/Ads/Entitlement
 *
 * @file      Entitlement.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { Thunk } from "@sorrell/effect/Function";
import { useSyncExternalStore } from "react";

let ConfirmedFree: boolean | null = null;
const Listeners = new Set<() => void>();

export/** Called only after server verification. */
const SetConfirmedFree = (Value: boolean | null): void =>
{
    if (ConfirmedFree === Value)
    {
        return;
    }

    ConfirmedFree = Value;

    for (const Listener of Listeners)
    {
        Listener();
    }
};

export/** Paid and unresolved users are both ad-free. */
const IsAdFree = (): boolean => ConfirmedFree !== true;

export/** Reactive form of {@link IsAdFree}. */
const useIsAdFree = (): boolean => useSyncExternalStore(
    (Listener: Thunk) =>
    {
        Listeners.add(Listener);
        return () => Listeners.delete(Listener);
    },
    IsAdFree,
    () => true
);
