/**
 * The OAuth sign-in flow. Notivex authenticates with the user's **Notion**
 * account (Notion is enabled as a Supabase Auth provider): the app asks Supabase
 * for the Notion authorization URL, opens it in an in-app browser session, and
 * turns the redirected-back URL into a session — no provider secret ever lives
 * in the app. Granting the Notivex integration access to content is
 * a *separate* step (the content integration).
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

const redirectTo = "notivex://" as const;

/* expo-web-browser's Android default (`createTask: true`) launches the Custom
 * Tab through a trampoline activity in a *separate* task so the tab survives
 * the app being backgrounded. That trampoline only closes itself when the
 * user dismisses the tab and its own activity resumes — but the OAuth
 * redirect back to `notivex://` targets the app's MainActivity directly, so
 * the trampoline's task is never resumed and is abandoned instead, leaving
 * the Custom Tab running underneath. Repeated sign-in attempts pile these up
 * as orphaned browser tasks, and once enough accumulate Chrome stops
 * rendering new launches as a Custom Tab at all and falls back to a full,
 * ordinary browser window/tab — which is what made this look like it was
 * "escaping" to the default browser. Opting out of the trampoline keeps the
 * Custom Tab in the app's own task, so returning via the deep link finishes
 * it the normal way. */
const BrowserOptions = { createTask: false } as const;

/* eslint-disable-next-line jsdoc/require-jsdoc */
const CreateSessionFromUrl = async (Url: string): Promise<Session | null> =>
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
            redirectTo,
            skipBrowserRedirect: true
        },
        provider: "notion"
    });

    if (error)
    {
        throw error;
    }

    const Result = await WebBrowser.openAuthSessionAsync(data?.url ?? "", redirectTo, BrowserOptions);

    if (Result.type === "success")
    {
        return CreateSessionFromUrl(Result.url);
    }

    return null;
};
