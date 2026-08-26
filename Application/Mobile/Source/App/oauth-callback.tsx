/**
 * Recovers an OAuth callback that cold-started or recreated the application.
 *
 * @module notivex/app/oauth-callback
 *
 * @file      oauth-callback.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { ActivityIndicator, View } from "react-native";
import {
    ClearPendingInitialOAuthCallback,
    CompleteSignInFromUrl,
    GetPendingInitialOAuthCallback,
    GetOAuthCallbackKind,
    useAuth
} from "@/Domain/Auth";
import { ConnectNotion } from "@/Domain/Connection";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useOnboarding } from "@/features/onboarding/onboarding-context";
import { useTheme } from "@notivex/ui";

type RecoveryResult =
    | { readonly Destination: "SignIn"; }
    | { readonly Destination: "Sync"; readonly Succeeded: boolean; };

const RecoveryRuns = new Map<string, Promise<RecoveryResult>>();

/** Produces a non-sensitive in-memory key for single-flight callback recovery. */
const GetRecoveryKey = (Url: string): string =>
{
    let Hash = 2166136261;

    for (let Index = 0; Index < Url.length; Index += 1)
    {
        Hash ^= Url.charCodeAt(Index);
        Hash = Math.imul(Hash, 16777619);
    }

    return `${ Url.length }:${ Hash >>> 0 }`;
};

/** Completes one recovered callback without allowing a remount to run it twice. */
const RecoverCallback = (
    ReturnUrl: string,
    HasRestoredSession: boolean
): Promise<RecoveryResult> =>
{
    const Key = `${ GetRecoveryKey(ReturnUrl) }:${ HasRestoredSession }`;
    const Existing = RecoveryRuns.get(Key);

    if (Existing)
    {
        return Existing;
    }

    const Run = (async (): Promise<RecoveryResult> =>
    {
        const Kind = GetOAuthCallbackKind(ReturnUrl);

        if (Kind === "Identity")
        {
            const Session = await CompleteSignInFromUrl(ReturnUrl);

            if (Session === null)
            {
                return { Destination: "SignIn" };
            }

            return {
                Destination: "Sync",
                Succeeded: await ConnectNotion()
            };
        }

        if (Kind === "NotionConnection")
        {
            if (!HasRestoredSession)
            {
                return { Destination: "SignIn" };
            }

            return {
                Destination: "Sync",
                Succeeded: new URL(ReturnUrl).searchParams.get("status") === "connected"
            };
        }

        return { Destination: "SignIn" };
    })().catch((Error: unknown): RecoveryResult =>
    {
        console.error("Failed to recover the OAuth callback", Error);

        return { Destination: "SignIn" };
    });

    RecoveryRuns.set(Key, Run);

    return Run;
};

const OAuthCallbackScreen = (): React.JSX.Element =>
{
    const Theme = useTheme();
    const Router = useRouter();
    const { IsLoading, Session } = useAuth();
    const { Complete, RecordAuthorizationResult } = useOnboarding();
    const [ ReturnUrl ] = useState(GetPendingInitialOAuthCallback);
    const [ HadRestoredSession ] = useState(Session !== null);
    const [ Result, SetResult ] = useState<RecoveryResult | null>(() => ReturnUrl === null
        ? { Destination: "SignIn" }
        : null);

    useEffect(() =>
    {
        if (IsLoading || ReturnUrl === null)
        {
            return;
        }

        let Cancelled = false;

        void RecoverCallback(ReturnUrl, HadRestoredSession).then((Next: RecoveryResult) =>
        {
            if (!Cancelled)
            {
                SetResult(Next);
            }
        });

        return () =>
        {
            Cancelled = true;
        };
    }, [ HadRestoredSession, IsLoading, ReturnUrl ]);

    useEffect(() =>
    {
        if (Result === null)
        {
            return;
        }

        if (Result.Destination === "SignIn")
        {
            void Complete().finally(() =>
            {
                ClearPendingInitialOAuthCallback(ReturnUrl);
                Router.replace("/sign-in");
            });

            return;
        }

        if (Session !== null)
        {
            RecordAuthorizationResult(Result.Succeeded);
            ClearPendingInitialOAuthCallback(ReturnUrl);
            Router.replace("/sync");
        }
    }, [ Complete, RecordAuthorizationResult, Result, ReturnUrl, Router, Session ]);

    return (
        <View
            accessibilityLabel="Finishing Notion authorization"
            style={ {
                alignItems: "center",
                backgroundColor: Theme.Semantic.BackgroundMain,
                flex: 1,
                justifyContent: "center"
            } }>
            <ActivityIndicator color={ Theme.Semantic.Cursor } size="large" />
        </View>
    );
};

export default OAuthCallbackScreen;
