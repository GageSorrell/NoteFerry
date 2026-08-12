/**
 * The OAuth sign-in flow. Notivex authenticates with the user's **Notion**
 * account (Notion is enabled as a Supabase Auth provider): the app asks Supabase
 * for the Notion authorization URL, opens it in an in-app browser session, and
 * turns the redirected-back URL into a session — no provider secret ever lives
 * in the app (ArchitectureInitialDraft.md §6, §7). Granting the Notivex
 * integration access to content is a *separate* step (the content integration).
 *
 * @module notivex/Domain/Auth/OAuth
 *
 * @file      OAuth.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import type { Session } from "@supabase/supabase-js";
import { Supabase } from "@/Domain/Runtime/Supabase";

/* Required so a dangling web auth session can complete (web/dev only). */
WebBrowser.maybeCompleteAuthSession();

/* The deep link Supabase redirects back to after authorization. Must be added     *
 * to the project's Auth "Redirect URLs" allow-list (see AUTH_SETUP.md). In a      *
 * dev/standalone build this is `notivex://`; in Expo Go it is an `exp://...` URL. *
 * The log makes the exact value visible in the Metro terminal.                    */
const redirectTo = "notivex://";

/* eslint-disable-next-line jsdoc/require-jsdoc */
async function CreateSessionFromUrl(Url: string): Promise<Session | null>
{
    const { params, errorCode } = QueryParams.getQueryParams(Url);

    if (errorCode)
    {
        throw new Error(errorCode);
    }

    /* eslint-disable-next-line @typescript-eslint/naming-convention */
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
}

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
            redirectTo,
            skipBrowserRedirect: true
        },
        provider: "notion"
    });

    if (error)
    {
        throw error;
    }

    const Result = await WebBrowser.openAuthSessionAsync(data?.url ?? "", redirectTo);

    if (Result.type === "success")
    {
        return CreateSessionFromUrl(Result.url);
    }

    return null;
};
