/**
 * The OAuth sign-in flow. NoteFerry authenticates with the user's **Notion**
 * account (Notion is enabled as a Supabase Auth provider): the app asks Supabase
 * for the Notion authorization URL, opens it in an in-app browser session, and
 * turns the redirected-back URL into a session. The callback also carries the
 * short-lived provider credentials for the Notion integration the user just
 * approved; the app immediately hands those to the authenticated API rather
 * than asking the user to approve the same integration a second time.
 *
 * @module noteferry/Domain/Auth/OAuth
 *
 * @file      OAuth.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import { IdentityReturnUrl } from "./OAuthRedirect";
import { OpenAuthSession } from "./OAuthBrowser";
import type { Session } from "@supabase/supabase-js";
import { Supabase } from "@/Domain/Runtime/Supabase";

/* Required so a dangling web auth session can complete (web/dev only). */
WebBrowser.maybeCompleteAuthSession();

/** The Supabase session and transient Notion credentials returned by one sign-in. */
export interface OAuthSignInResult
{
    readonly ProviderRefreshToken?: string | undefined;
    readonly ProviderToken: string;
    readonly Session: Session;
}

export/**
       * Completes a Supabase identity callback and persists its session.
       * Shared by the live auth-session result and cold-start recovery route.
       *
       * @category Auth
       * @since 1.0.0
       */
const CompleteSignInFromUrl = async (Url: string): Promise<OAuthSignInResult | null> =>
{
    const { params, errorCode } = QueryParams.getQueryParams(Url);

    if (errorCode)
    {
        throw new Error(errorCode);
    }

    /* eslint-disable-next-line @typescript-eslint/naming-convention */
    const {
        access_token,
        provider_refresh_token,
        provider_token,
        refresh_token
    } = params;

    if (!access_token || !provider_token)
    {
        return null;
    }

    const { data, error } = await Supabase.auth.setSession({ access_token, refresh_token });

    if (error)
    {
        throw error;
    }

    if (data.session === null)
    {
        return null;
    }

    return {
        ProviderToken: provider_token,
        Session: data.session,
        ...(provider_refresh_token
            ? { ProviderRefreshToken: provider_refresh_token }
            : { })
    };
};

export/**
       * Runs the full OAuth flow for `Provider` and returns the resulting session
       * (or `null` if the user dismissed the browser). Throws on provider/Supabase
       * errors.
       *
       * @category Auth
       * @since 1.0.0
       */
const SignInWithOAuth = async (): Promise<OAuthSignInResult | null> =>
{
    const { data, error } = await Supabase.auth.signInWithOAuth({
        options:
        {
            redirectTo: IdentityReturnUrl,
            skipBrowserRedirect: true
        },
        provider: "notion"
    });

    if (error)
    {
        throw error;
    }

    const Result = await OpenAuthSession(
        data?.url ?? "",
        IdentityReturnUrl
    );

    if (Result.type === "success")
    {
        return CompleteSignInFromUrl(Result.url);
    }

    return null;
};
