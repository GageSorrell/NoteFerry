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
import { Supabase } from "@/runtime/supabase";

/** The shape provided to consumers of {@link UseAuth}. */
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

/**
 * Subscribes to Supabase auth-state changes and makes the session available
 * to the tree. Mount once, near the root.
 *
 * @category Providers
 * @since 1.0.0
 */
export function NotivexAuthProvider({ children }: React.PropsWithChildren)
{
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
                data:
                {
                    session: null;
                };

                error: AuthError;
            }
            | {
                readonly data:
                {
                    readonly session: null;
                };

                readonly error: null;
            };

        Supabase.auth.getSession().then(({ data }: SessionArg) =>
        {
            SetSession(data.session);
            SetIsLoading(false);
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
        <AuthContext.Provider { ...{ value } }>
            { children }
        </AuthContext.Provider>
    );
}

export/**
       * Reads the current auth context.
       *
       * @category Auth
       * @since 1.0.0
       */
const UseAuth = (): NotivexAuth => React.useContext(AuthContext);
