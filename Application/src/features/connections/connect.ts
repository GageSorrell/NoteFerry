/**
 * Kicks off the Notion "connect" flow: ask the backend for an authorization URL
 * (which also records the one-time OAuth state), open it in an in-app browser,
 * and let the `notion-oauth-callback` Edge Function redirect back into the app
 * at `notivex://notion/connected`. The token exchange happens server-side; the
 * app never sees Notion credentials (ArchitectureInitialDraft.md §7).
 *
 * @module notivex/features/connections/connect
 *
 * @file      connect.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as WebBrowser from "expo-web-browser";
import { StartNotionAuthorization } from "@/runtime/notivex-api";

const ConnectedReturnUrl = "notivex://notion/connected";

/**
 * Runs the Notion connect flow to completion (or until the user dismisses the
 * browser). Callers should refetch connections afterward.
 *
 * @category Connections
 * @since 1.0.0
 */
export async function ConnectNotion(): Promise<void>
{
    const AuthorizationUrl = await StartNotionAuthorization();

    await WebBrowser.openAuthSessionAsync(AuthorizationUrl, ConnectedReturnUrl);
}
