/**
 * React context exposing the current Supabase session to the component tree.
 * This is the outer, React-facing edge of auth ("React should sit at the
 * outside edge of Effect"); the Effect-facing seam is {@link CurrentUser}.
 *
 * @module noteferry/Domain/Auth/NoteFerryAuthProvider
 *
 * @file      NoteFerryAuthProvider.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Application from "expo-application";
import * as React from "react";
import type { AuthChangeEvent, AuthError, Session } from "@supabase/supabase-js";
import { Platform } from "react-native";
import { RemoveSubscriptionSaleDevice } from "@/Domain/Runtime/NoteFerryApi";
import { Supabase } from "@/Domain/Runtime/Supabase";

const CurrentDeviceId = async (): Promise<string> =>
{
    return Platform.OS === "ios"
        ? `ios:${await Application.getIosIdForVendorAsync() ?? "unknown"}`
        : `android:${Application.getAndroidId()}`;
};

/* The longest the initial session restore is allowed to hold up navigation.
 * Well above the (now much shorter) storage-read budgets in
 * `SecureSessionStore`/`BootStore`, so this only fires on a genuine stall, not
 * the common case — at which point the app proceeds as signed-out rather than
 * blocking indefinitely, while the underlying read keeps running in the
 * background and can still self-heal into a signed-in state if it resolves
 * late. See {@link NoteFerryAuthProvider}. */
const RestoreTimeoutMs = 6000;

/** The shape provided to consumers of {@link useAuth}. */
export interface NoteFerryAuth
{
    readonly IsLoading: boolean;
    readonly RetryRestore: () => void;
    readonly Session: Session | null;
    readonly SignOut: () => Promise<void>;
    readonly SkipRestore: () => void;
}

const AuthContext = React.createContext<NoteFerryAuth>({
    IsLoading: true,
    RetryRestore: () => { },
    Session: null,
    SignOut: async () => { },
    SkipRestore: () => { }
});

export/**
       * Subscribes to Supabase auth-state changes and makes the session available
       * to the tree. Mount once, near the root.
       *
       * @category Providers
       * @since 1.0.0
       */
const NoteFerryAuthProvider = ({ children }: React.PropsWithChildren) =>
{
    /* The React Compiler otherwise memoizes the context value so aggressively
     * that a change to `IsLoading` does not reach consumers, stranding the app
     * on a blank gate. Opt this provider out so session state propagates. */
    "use no memo";

    const [ Session, SetSession ] = React.useState<Session | null>(null);
    const [ IsLoading, SetIsLoading ] = React.useState(true);
    const [ RestoreAttempt, SetRestoreAttempt ] = React.useState(0);

    React.useEffect(() =>
    {
        type SessionArg =
            | {
                readonly data:
                {
                    readonly session: Session;
                };

                readonly error: null;
            }
            | {
                readonly data:
                {
                    readonly session: null;
                };

                readonly error: AuthError;
            }
            | {
                readonly data:
                {
                    readonly session: null;
                };

                readonly error: null;
            };

        let Cancelled = false;

        /* Whether *something* has already told the app what its session is —
         * either this effect's own restore read, or an explicit
         * `onAuthStateChange` event arriving first (e.g. the user finishes
         * sign-in while the initial read is still in flight). Once true, a
         * *late* resolution of the original restore read may still upgrade a
         * null session to a real one (the point of retaining it rather than
         * discarding it — see `SecureSessionStore`/`BootStore`), but must
         * never downgrade a real session back to null, which would undo
         * whatever set it in the meantime. */
        let Settled = false;
        let ExplicitEventReceived = false;

        /* The initial restore must never leave the app on a blank gate. A
         * short fallback lets navigation proceed signed-out if storage is
         * unusually slow; the read itself is not abandoned, so a late result
         * can still upgrade the session afterward instead of being thrown
         * away. */
        const FallbackTimer = setTimeout(() =>
        {
            if (Cancelled || Settled)
            {
                return;
            }

            SetIsLoading(false);
        }, RestoreTimeoutMs);

        void (async (): Promise<void> =>
        {
            let NextSession: Session | null = null;

            try
            {
                const { data }: SessionArg = await Supabase.auth.getSession();

                NextSession = data.session;
            }
            catch
            {
                NextSession = null;
            }

            if (Cancelled)
            {
                return;
            }

            if (!Settled)
            {
                Settled = true;
                clearTimeout(FallbackTimer);
                /* Publish the locally-restored session immediately — do not
                 * wait on a network refresh below, so a slow/offline refresh
                 * cannot delay initial navigation. */
                SetSession(NextSession);
                SetIsLoading(false);
            }
            else if (NextSession !== null && !ExplicitEventReceived)
            {
                SetSession(NextSession);
            }

            /* A restored access token can be structurally valid while an API
             * gateway rejects its issued-at timestamp (for example after a
             * device clock correction). Refresh once on cold start, in the
             * background, so downstream API requests receive a freshly issued
             * token — a failure here keeps the already-published session
             * rather than undoing it. */
            if (NextSession !== null)
            {
                try
                {
                    const Refreshed = await Supabase.auth.refreshSession(NextSession);

                    if (!Cancelled && !ExplicitEventReceived && Refreshed.data.session)
                    {
                        SetSession(Refreshed.data.session);
                    }
                }
                catch
                {
                    /* Keep the restored session. Normal auth expiry handling
                     * can still refresh it or sign the user out later. */
                }
            }
        })();

        const { data } = Supabase.auth.onAuthStateChange((
            _Event: AuthChangeEvent,
            NextSession: Session | null
        ) =>
        {
            if (Cancelled)
            {
                return;
            }

            Settled = true;
            ExplicitEventReceived = true;
            clearTimeout(FallbackTimer);
            SetSession(NextSession);
            SetIsLoading(false);
        });

        return () =>
        {
            Cancelled = true;
            clearTimeout(FallbackTimer);
            data.subscription.unsubscribe();
        };
    }, [ RestoreAttempt ]);

    const RetryRestore = React.useCallback((): void =>
    {
        SetIsLoading(true);
        SetRestoreAttempt((Attempt: number) => Attempt + 1);
    }, [ ]);

    const SkipRestore = React.useCallback((): void =>
    {
        SetIsLoading(false);
    }, [ ]);

    const value = React.useMemo<NoteFerryAuth>(() => ({
        IsLoading,
        RetryRestore,
        Session,
        SignOut: async () =>
        {
            try
            {
                await RemoveSubscriptionSaleDevice(await CurrentDeviceId());
            }
            catch
            {
                /* Sign-out must still finish if best-effort token cleanup fails. */
            }
            await Supabase.auth.signOut();
        },
        SkipRestore
    }), [ IsLoading, RetryRestore, Session, SkipRestore ]);

    return (
        <AuthContext.Provider value={ value }>
            { children }
        </AuthContext.Provider>
    );
};

export/**
       * Reads the current auth context.
       *
       * @category Auth
       * @since 1.0.0
       */
const useAuth = (): NoteFerryAuth => React.useContext(AuthContext);
