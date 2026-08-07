/**
 * React context exposing the current Supabase session to the component tree.
 * This is the outer, React-facing edge of auth (ArchitectureInitialDraft.md
 * §34: "React should sit at the outside edge of Effect"); the Effect-facing
 * seam is {@link CurrentUser}.
 *
 * @module notivex/providers/auth-provider
 *
 * @file      auth-provider.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { AuthChangeEvent, AuthError, Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { Supabase } from "@/runtime/supabase";

/** The shape provided to consumers of {@link useAuth}. */
export interface AuthContextValue
{
    readonly IsLoading: boolean;
    readonly Session: Session | null;
    readonly SignOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    IsLoading: true,
    Session: null,
    /* eslint-disable-next-line @typescript-eslint/no-empty-function */
    SignOut: async () => { }
});

/**
 * Subscribes to Supabase auth-state changes and makes the session available
 * to the tree. Mount once, near the root.
 *
 * @category Providers
 * @since 1.0.0
 */
export function AuthProvider({ children }: PropsWithChildren)
{
    const [ Session, SetSession ] = useState<Session | null>(null);
    const [ IsLoading, SetIsLoading ] = useState(true);

    useEffect(() =>
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

    const Value = useMemo<AuthContextValue>(() => ({
        IsLoading,
        Session,
        SignOut: async () =>
        {
            await Supabase.auth.signOut();
        }
    }), [ IsLoading, Session ]);

    return <AuthContext.Provider value={ Value }>{ children }</AuthContext.Provider>;
}

/**
 * Reads the current auth context.
 *
 * @category Providers
 * @since 1.0.0
 */
export function useAuth(): AuthContextValue
{
    return useContext(AuthContext);
}
