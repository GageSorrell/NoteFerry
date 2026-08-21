/**
 * Kicks off the Notion "connect" flow: ask the backend for an authorization URL
 * (which also records the one-time OAuth state), open it in an in-app browser,
 * and let the `notion-oauth-callback` Edge Function redirect back into the app
 * at `notivex://notion/connected`. The token exchange happens server-side; the
 * app never sees Notion credentials.
 *
 * @module notivex/Domain/Connection/Connect
 *
 * @file      Connect.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as WebBrowser from "expo-web-browser";
import { StartNotionAuthorization } from "@/Domain/Runtime/NotivexApi";

const ConnectedReturnUrl = "notivex://notion/connected" as const;

/* See the matching comment in Domain/Auth/OAuth.ts: without `createTask:
 * false`, Android launches this Custom Tab through a separate-task
 * trampoline that the `notivex://` redirect never resumes, leaking an
 * orphaned browser task per attempt. */
const BrowserOptions = { createTask: false } as const;

/**
 * Runs the Notion connect flow to completion (or until the user dismisses the
 * browser).  Callers should refetch connections afterward.
 *
 * @category Connections
 * @since 1.0.0
 */
export async function ConnectNotion(): Promise<boolean>
{
    const AuthorizationUrl = await StartNotionAuthorization();
    const Result = await WebBrowser.openAuthSessionAsync(
        AuthorizationUrl,
        ConnectedReturnUrl,
        BrowserOptions
    );

    if (Result.type !== "success")
    {
        return false;
    }

    const ReturnUrl = new URL(Result.url);

    return ReturnUrl.searchParams.get("status") === "connected";
}
