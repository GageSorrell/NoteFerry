/**
 * Server-only Notion OAuth helpers. Runs in the Supabase Edge (Deno) runtime.
 * The Notion client secret lives only here, via edge-function secrets — it can
 * never exist in the distributed mobile binary (ArchitectureInitialDraft.md §7).
 *
 * Kept deliberately small (§32): this slice needs the authorization-code
 * exchange; `RefreshAuthorization`/`RevokeAuthorization` land with later slices.
 *
 * @module notivex/functions/_shared/Notion
 *
 * @file      Notion.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** The current Notion API version (ArchitectureInitialDraft.md §4, §11). */
export const NotionVersion = "2026-03-11";

const TokenEndpoint = "https://api.notion.com/v1/oauth/token";
const AuthorizeEndpoint = "https://api.notion.com/v1/oauth/authorize";

/** The subset of Notion's OAuth token response Notivex persists (§8). */
export type NotionOAuthTokens =
{
    readonly access_token: string;
    readonly bot_id: string;
    readonly duplicated_template_id: string | null;
    readonly owner: { readonly user?: { readonly id?: string } } | null;
    readonly refresh_token: string | null;
    readonly workspace_icon: string | null;
    readonly workspace_id: string;
    readonly workspace_name: string | null;
};

/** Thrown when Notion rejects or fails the token exchange. */
export class NotionOAuthError extends Error
{
    public constructor(public readonly Status: number, Message: string)
    {
        super(`Notion OAuth failed (${Status}): ${Message}`);
        this.name = "NotionOAuthError";
    }
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function BasicAuthHeader(ClientId: string, ClientSecret: string): string
{
    return `Basic ${btoa(`${ClientId}:${ClientSecret}`)}`;
}

/**
 * Builds the Notion authorization URL the client opens to begin the OAuth
 * flow. `RedirectUri` must exactly match the integration's registered URI.
 *
 * @category Notion
 * @since 1.0.0
 */
export function BuildAuthorizationUrl(Options: {
    readonly ClientId: string;
    readonly RedirectUri: string;
    readonly State: string;
}): string
{
    const Url = new URL(AuthorizeEndpoint);

    Url.searchParams.set("client_id", Options.ClientId);
    Url.searchParams.set("response_type", "code");
    Url.searchParams.set("owner", "user");
    Url.searchParams.set("redirect_uri", Options.RedirectUri);
    Url.searchParams.set("state", Options.State);

    return Url.toString();
}

/**
 * Exchanges an authorization code for Notion OAuth tokens using HTTP Basic
 * `client_id:client_secret` auth (§7). Throws {@link NotionOAuthError} on
 * failure.
 *
 * @category Notion
 * @since 1.0.0
 */
export async function ExchangeAuthorizationCode(Options: {
    readonly ClientId: string;
    readonly ClientSecret: string;
    readonly Code: string;
    readonly RedirectUri: string;
}): Promise<NotionOAuthTokens>
{
    const Response = await fetch(TokenEndpoint, {
        body: JSON.stringify({
            code: Options.Code,
            grant_type: "authorization_code",
            redirect_uri: Options.RedirectUri
        }),
        headers:
        {
            "Authorization": BasicAuthHeader(Options.ClientId, Options.ClientSecret),
            "Content-Type": "application/json",
            "Notion-Version": NotionVersion
        },
        method: "POST"
    });

    if (!Response.ok)
    {
        throw new NotionOAuthError(Response.status, await Response.text());
    }

    return await Response.json() as NotionOAuthTokens;
}
