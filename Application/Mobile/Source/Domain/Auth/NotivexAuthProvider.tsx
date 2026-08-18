/**
 * React context exposing the current Supabase session to the component tree.
 * This is the outer, React-facing edge of auth (ArchitectureInitialDraft.md
 * §34: "React should sit at the outside edge of Effect"); the Effect-facing
 * seam is {@link CurrentUser}.
 *
 * @module notivex/Domain/Auth/NotivexAuthProvider
 *
 * @file      NotivexAuthProvider.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import type { AuthChangeEvent, AuthError, Session } from "@supabase/supabase-js";
import { Supabase } from "@/Domain/Runtime/Supabase";

/** The shape provided to consumers of {@link useAuth}. */
export interface NotivexAuth
{
    readonly IsLoading: boolean;
    readonly Session: Session | null;
    readonly SignOut: () => Promise<void>;
}

const AuthContext = React.createContext<NotivexAuth>({
    IsLoading: true,
    Session: null,
    SignOut: async () => { }
});

export/**
       * Subscribes to Supabase auth-state changes and makes the session available
       * to the tree. Mount once, near the root.
       *
       * @category Providers
       * @since 1.0.0
       */
const NotivexAuthProvider = ({ children }: React.PropsWithChildren) =>
{
    /* The React Compiler otherwise memoizes the context value so aggressively
     * that a change to `IsLoading` does not reach consumers, stranding the app
     * on a blank gate. Opt this provider out so session state propagates. */
    "use no memo";

    const [ Session, SetSession ] = React.useState<Session | null>(null);
    const [ IsLoading, SetIsLoading ] = React.useState(true);

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

        let HasSettled = false;

        const Settle = (NextSession: Session | null): void =>
        {
            if (HasSettled)
            {
                return;
            }

            HasSettled = true;
            SetSession(NextSession);
            SetIsLoading(false);
        };

        /* The initial session read must never leave the app on a blank gate. The
         * storage adapter already retries a cold-start read for up to ~12s; this
         * is a last-resort guard above that window, so a catastrophic hang still
         * falls back to signed-out rather than stranding the app. A later
         * `onAuthStateChange` still upgrades to a restored or fresh session. */
        const FallbackTimer = setTimeout(() => Settle(null), 15000);

        Supabase.auth.getSession().then(async ({ data }: SessionArg) =>
        {
            let NextSession = data.session;

            /* A restored access token can be structurally valid while an API
             * gateway rejects its issued-at timestamp (for example after a
             * device clock correction). Refresh once on cold start so every
             * downstream API request receives a freshly issued token. */
            if (NextSession !== null)
            {
                try
                {
                    const Refreshed = await Supabase.auth.refreshSession(NextSession);

                    NextSession = Refreshed.data.session ?? NextSession;
                }
                catch
                {
                    /* Keep the restored session. Normal auth expiry handling
                     * can still refresh it or sign the user out later. */
                }
            }

            clearTimeout(FallbackTimer);
            Settle(NextSession);
        }).catch(() =>
        {
            clearTimeout(FallbackTimer);
            Settle(null);
        });

        const { data } = Supabase.auth.onAuthStateChange((
            _Event: AuthChangeEvent,
            NextSession: Session | null
        ) =>
        {
            SetSession(NextSession);
        });

        return data.subscription.unsubscribe;
    }, [ ]);

    const value = React.useMemo<NotivexAuth>(() => ({
        IsLoading,
        Session,
        SignOut: async () =>
        {
            await Supabase.auth.signOut();
        }
    }), [ IsLoading, Session ]);

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
const useAuth = (): NotivexAuth => React.useContext(AuthContext);
