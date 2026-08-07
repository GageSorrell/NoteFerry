/**
 * The native OAuth sign-in flow. Following Supabase's Expo guidance, the app
 * asks Supabase for a provider authorization URL, opens it in an in-app browser
 * session, and turns the redirected-back URL into a session — the Notion client
 * secret and provider secrets never live in the app (ArchitectureInitialDraft.md
 * §6, §7). This is the portable web-OAuth flow; native "Sign in with Apple"
 * (`expo-apple-authentication`) is a later iOS UX upgrade.
 *
 * @module notivex/features/auth/oauth
 *
 * @file      oauth.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import { Supabase } from "@/runtime/supabase";
import type { Session } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";

/* Required so a dangling web auth session can complete (web/dev only). */
WebBrowser.maybeCompleteAuthSession();

/** The providers Notivex offers today. */
export type OAuthProvider = "apple" | "google";

/* The deep link Supabase redirects back to after authorization. Must be added
 * to the project's Auth "Redirect URLs" allow-list (see AUTH_SETUP.md). In a
 * dev/standalone build this is `notivex://`; in Expo Go it is an `exp://…` URL.
 * The log makes the exact value visible in the Metro terminal. */
const RedirectTo = makeRedirectUri();

/* eslint-disable-next-line no-console */
console.log("[Notivex] OAuth redirectTo:", RedirectTo);

/* eslint-disable-next-line jsdoc/require-jsdoc */
async function CreateSessionFromUrl(Url: string): Promise<Session | null>
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

    const { data, error } = await Supabase.auth.setSession({
        access_token,
        refresh_token
    });

    if (error)
    {
        throw error;
    }

    return data.session;
}

/**
 * Runs the full OAuth flow for `Provider` and returns the resulting session
 * (or `null` if the user dismissed the browser). Throws on provider/Supabase
 * errors.
 *
 * @category Auth
 * @since 1.0.0
 */
export async function SignInWithOAuth(Provider: OAuthProvider): Promise<Session | null>
{
    const { data, error } = await Supabase.auth.signInWithOAuth({
        options:
        {
            redirectTo: RedirectTo,
            skipBrowserRedirect: true
        },
        provider: Provider
    });

    if (error)
    {
        throw error;
    }

    const Result = await WebBrowser.openAuthSessionAsync(data?.url ?? "", RedirectTo);

    if (Result.type === "success")
    {
        return CreateSessionFromUrl(Result.url);
    }

    return null;
}
