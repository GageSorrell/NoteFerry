/**
 * The unauthenticated Notion OAuth callback (ArchitectureInitialDraft.md §17).
 * Notion redirects the browser here after the user authorizes. Its authority is
 * the one-time `state`, not a Supabase JWT — so this function is deployed with
 * `verify_jwt = false`.
 *
 * Flow (§7): verify state → exchange code (server-side, with the client secret)
 * → persist connection metadata + server-only credentials → redirect back into
 * the app via the `notivex://` deep link.
 *
 * @module notivex/functions/notion-oauth-callback
 *
 * @file      index.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { AdminClient, PrivateSchema } from "../_shared/Database.ts";
import { ExchangeAuthorizationCode } from "../_shared/Notion.ts";

const AppReturnUrl = "notivex://notion/connected";

/* eslint-disable-next-line jsdoc/require-jsdoc */
function RedirectToApp(Params: Record<string, string>): Response
{
    const Url = new URL(AppReturnUrl);

    for (const [ Key, Value ] of Object.entries(Params))
    {
        Url.searchParams.set(Key, Value);
    }

    return new Response(null, {
        headers: { Location: Url.toString() },
        status: 302
    });
}

Deno.serve(async (Request: Request) =>
{
    const Url = new URL(Request.url);
    const Code = Url.searchParams.get("code");
    const State = Url.searchParams.get("state");
    const NotionError = Url.searchParams.get("error");

    if (NotionError)
    {
        return RedirectToApp({ error: NotionError });
    }

    if (!Code || !State)
    {
        return RedirectToApp({ error: "missing_code_or_state" });
    }

    /* 1. Verify the one-time state and resolve the user it belongs to. */
    const { data: StateRow } = await PrivateSchema
        .from("notion_oauth_states")
        .select("state, user_id, expires_at")
        .eq("state", State)
        .maybeSingle();

    if (!StateRow || new Date(StateRow.expires_at).getTime() < Date.now())
    {
        return RedirectToApp({ error: "invalid_state" });
    }

    const ClientId = Deno.env.get("NOTION_OAUTH_CLIENT_ID");
    const ClientSecret = Deno.env.get("NOTION_OAUTH_CLIENT_SECRET");
    const RedirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/notion-oauth-callback`;

    if (!ClientId || !ClientSecret)
    {
        return RedirectToApp({ error: "server_misconfigured" });
    }

    try
    {
        /* 2. Exchange the code for tokens (server-side). */
        const Tokens = await ExchangeAuthorizationCode({
            ClientId,
            ClientSecret,
            Code,
            RedirectUri
        });

        /* 3. Upsert the non-secret connection metadata. */
        const { data: Connection, error: ConnectionError } = await AdminClient
            .from("notion_connections")
            .upsert(
                {
                    bot_id: Tokens.bot_id,
                    notion_owner_user_id: Tokens.owner?.user?.id ?? null,
                    revoked_at: null,
                    status: "Active",
                    user_id: StateRow.user_id,
                    workspace_icon_url: Tokens.workspace_icon,
                    workspace_id: Tokens.workspace_id,
                    workspace_name: Tokens.workspace_name ?? "Notion workspace"
                },
                { onConflict: "user_id,bot_id" }
            )
            .select("id")
            .single();

        if (ConnectionError || !Connection)
        {
            return RedirectToApp({ error: "persist_failed" });
        }

        /* 4. Store the server-only credentials. */
        const { error: CredentialError } = await PrivateSchema
            .from("notion_connection_credentials")
            .upsert(
                {
                    access_token: Tokens.access_token,
                    connection_id: Connection.id,
                    refresh_token: Tokens.refresh_token
                },
                { onConflict: "connection_id" }
            );

        if (CredentialError)
        {
            return RedirectToApp({ error: "persist_failed" });
        }

        /* 5. Consume the one-time state and return to the app. */
        await PrivateSchema.from("notion_oauth_states").delete().eq("state", State);

        return RedirectToApp({ status: "connected" });
    }
    catch
    {
        return RedirectToApp({ error: "exchange_failed" });
    }
});
