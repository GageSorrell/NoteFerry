/** Reactive ad eligibility. Unresolved billing state always suppresses ads. */

import { useSyncExternalStore } from "react";

let ConfirmedFree: boolean | null = null;
const Listeners = new Set<() => void>();

/** Called only after server verification. */
export const SetConfirmedFree = (Value: boolean | null): void =>
{
    if (ConfirmedFree === Value) return;
    ConfirmedFree = Value;
    for (const Listener of Listeners) Listener();
};

/** Paid and unresolved users are both ad-free. */
export const IsAdFree = (): boolean => ConfirmedFree !== true;

/** Reactive form of {@link IsAdFree}. */
export const useIsAdFree = (): boolean => useSyncExternalStore(
    (Listener) =>
    {
        Listeners.add(Listener);
        return () => Listeners.delete(Listener);
    },
    IsAdFree,
    () => true
);
