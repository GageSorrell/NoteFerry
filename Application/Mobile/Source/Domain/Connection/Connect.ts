/**
 * Kicks off the Notion "connect" flow: ask the backend for an authorization URL
 * (which also records the one-time OAuth state), open it in an in-app browser,
 * and let the `notion-oauth-callback` Edge Function redirect back into the app
 * at `noteferry://notion/connected`. The token exchange happens server-side; the
 * app never sees Notion credentials.
 *
 * @module noteferry/Domain/Connection/Connect
 *
 * @file      Connect.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { NotionConnectedReturnUrl } from "@/Domain/Auth/OAuthRedirect";
import { OpenAuthSession } from "@/Domain/Auth/OAuthBrowser";
import { StartNotionAuthorization } from "@/Domain/Runtime/NoteFerryApi";

export/**
       * Runs the Notion connect flow to completion (or until the user dismisses the
       * browser).  Callers should refetch connections afterward.
       *
       * @category Connections
       * @since 1.0.0
       */
const ConnectNotion = async (): Promise<boolean> =>
{
    const AuthorizationUrl = await StartNotionAuthorization();
    const Result = await OpenAuthSession(
        AuthorizationUrl,
        NotionConnectedReturnUrl
    );

    if (Result.type !== "success")
    {
        return false;
    }

    const ReturnUrl = new URL(Result.url);

    return ReturnUrl.searchParams.get("status") === "connected";
};
