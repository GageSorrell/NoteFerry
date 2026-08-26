/**
 * The OAuth sign-in flow. NoteFerry authenticates with the user's **Notion**
 * account (Notion is enabled as a Supabase Auth provider): the app asks Supabase
 * for the Notion authorization URL, opens it in an in-app browser session, and
 * turns the redirected-back URL into a session — no provider secret ever lives
 * in the app. Granting the NoteFerry integration access to content is
 * a *separate* step (the content integration).
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

export/**
       * Completes a Supabase identity callback and persists its session.
       * Shared by the live auth-session result and cold-start recovery route.
       *
       * @category Auth
       * @since 1.0.0
       */
const CompleteSignInFromUrl = async (Url: string): Promise<Session | null> =>
{
    const { params, errorCode } = QueryParams.getQueryParams(Url);

    if (errorCode)
    {
        throw new Error(errorCode);
    }

    const { access_token, refresh_token } = params;

    if (!access_token)
    {
        return null;
    }

    const { data, error } = await Supabase.auth.setSession({ access_token, refresh_token });

    if (error)
    {
        throw error;
    }

    return data.session;
};

export/**
       * Runs the full OAuth flow for `Provider` and returns the resulting session
       * (or `null` if the user dismissed the browser). Throws on provider/Supabase
       * errors.
       *
       * @category Auth
       * @since 1.0.0
       */
const SignInWithOAuth = async (): Promise<Session | null> =>
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
