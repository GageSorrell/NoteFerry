/**
 * A single, shared `AsyncStorage` read for the whole app's cold-start path.
 * Before this existed, {@link SecureSessionStore} and the onboarding
 * "pending" flag each ran their own independent retry loop (up to twelve
 * one-second attempts apiece) against the same cold-start window during
 * which the native `AsyncStorage` module can accept a call before it is
 * ready to service it — paying that stall once per file instead of once per
 * boot. `BootStore` collapses all of that into one `getAllKeys` + `multiGet`,
 * started the moment this module loads, that every boot-time reader shares.
 *
 * @module noteferry/Domain/Runtime/BootStore
 *
 * @file      BootStore.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

/* How long a caller waits for the shared snapshot before treating a key as
 * absent. Short, because this is now the *only* AsyncStorage round trip on
 * the startup path rather than one of several — a healthy cold start resolves
 * in well under this, and a caller that hits the budget still gets the true
 * answer later via {@link BootStoreGetLate} rather than it being discarded. */
const ReadBudgetMs = 2500;

/**
 * One `getAllKeys` + `multiGet` for the whole app, started as soon as this
 * module is imported (i.e. as early in boot as any caller could need it).
 * Every reader shares this promise instead of issuing its own AsyncStorage
 * call.
 *
 * @category Runtime
 * @since 1.0.0
 */
const Snapshot: Promise<ReadonlyMap<string, string>> = (async (): Promise<ReadonlyMap<string, string>> =>
{
    const Keys = await AsyncStorage.getAllKeys();
    const Entries = await AsyncStorage.multiGet(Keys);

    return new Map(
        Entries.filter((Entry): Entry is [ string, string ] => Entry[ 1 ] !== null)
    );
})();

/**
 * Reads `Key` from the shared boot snapshot, waiting at most `ReadBudgetMs`.
 * Resolves to `null` on timeout so a slow cold start degrades to "value
 * absent" rather than stalling the caller — the underlying {@link Snapshot}
 * read is never abandoned, so a caller that needs the true, possibly late,
 * value can still get it from {@link BootStoreGetLate}.
 *
 * Only meaningful for the *first* read of a key at boot: this module never
 * re-reads storage, so a key written after the snapshot was captured (e.g.
 * via `AsyncStorage.setItem` later in the session) will not show up here.
 * Callers that read a key they may also write should track that themselves
 * and bypass `BootStore` once they have (see `SecureSessionStore`).
 *
 * @category Runtime
 * @since 1.0.0
 */
export const BootStoreGet = async (Key: string): Promise<string | null> =>
{
    const TimedOut = Symbol("timed-out");
    const Result = await Promise.race([
        Snapshot.then((Values: ReadonlyMap<string, string>) => Values.get(Key) ?? null),
        new Promise<typeof TimedOut>((Resolve: (Value: typeof TimedOut) => void): void =>
        {
            setTimeout(() => Resolve(TimedOut), ReadBudgetMs);
        })
    ]);

    return Result === TimedOut ? null : Result;
};

/**
 * The same read as {@link BootStoreGet}, without the budget — resolves once
 * the shared snapshot finishes, however long that takes. Intended for a
 * caller that already acted on a `BootStoreGet` timeout (e.g. showing a
 * signed-out UI) and wants to apply the true value if it turns out to differ,
 * rather than silently discarding a slow-but-real result.
 *
 * @category Runtime
 * @since 1.0.0
 */
export const BootStoreGetLate = (Key: string): Promise<string | null> =>
    Snapshot.then((Values: ReadonlyMap<string, string>) => Values.get(Key) ?? null);
