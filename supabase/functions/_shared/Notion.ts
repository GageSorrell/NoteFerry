/**
 * Server-only Notion OAuth helpers. Runs in the Supabase Edge (Deno) runtime.
 * The Notion client secret lives only here, via edge-function secrets — it can
 * never exist in the distributed mobile binary (ArchitectureInitialDraft.md §7).
 *
 * Kept deliberately small (§32): the OAuth authorization-code exchange, plus
 * the read seam the data-source slice needs — `SearchDataSources`,
 * `RetrieveDataSource` and `RefreshAuthorization`. `RevokeAuthorization` lands
 * with a later slice.
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

const ApiBase = "https://api.notion.com/v1";
const TokenEndpoint = `${ApiBase}/oauth/token`;
const AuthorizeEndpoint = `${ApiBase}/oauth/authorize`;

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

/**
 * Exchanges a refresh token for a fresh access/refresh token pair. Notion
 * rotates *both* tokens on refresh, so callers must persist the whole pair
 * together (ArchitectureInitialDraft.md §31). Throws {@link NotionOAuthError}.
 *
 * @category Notion
 * @since 1.0.0
 */
export async function RefreshAuthorization(Options: {
    readonly ClientId: string;
    readonly ClientSecret: string;
    readonly RefreshToken: string;
}): Promise<NotionOAuthTokens>
{
    const Response = await fetch(TokenEndpoint, {
        body: JSON.stringify({
            grant_type: "refresh_token",
            refresh_token: Options.RefreshToken
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

/* --- Data API (search / retrieve) ------------------------------------- */

/** One option of a Notion select/multi_select/status property. */
export type NotionOption =
{
    readonly id: string;
    readonly name: string;
    readonly color: string;
};

/**
 * A single Notion property as returned by the Data API. Only the fields
 * Notivex maps are typed; the rest of Notion's per-type payloads are ignored.
 */
export type NotionProperty =
{
    readonly id: string;
    readonly name: string;
    readonly type: string;
    readonly number?: { readonly format?: string };
    readonly select?: { readonly options?: readonly NotionOption[] };
    readonly multi_select?: { readonly options?: readonly NotionOption[] };
    readonly status?: { readonly options?: readonly NotionOption[] };
    readonly relation?:
    {
        readonly data_source_id?: string;
        readonly database_id?: string;
    };
};

/** Notion's icon union, as it appears on a data source. */
export type NotionIcon =
    | { readonly type: "emoji"; readonly emoji: string }
    | { readonly type: "external"; readonly external: { readonly url: string } }
    | { readonly type: "file"; readonly file: { readonly url: string } }
    | null;

/** One item of a Notion rich-text array (only `plain_text` is used). */
export type NotionRichTextItem = { readonly plain_text?: string };

/**
 * A Notion data source object, as returned by both `/search` (summary) and
 * `/data_sources/{id}` (full, with `properties`).
 */
export type NotionDataSourceObject =
{
    readonly object?: string;
    readonly id: string;
    readonly parent?: { readonly type?: string; readonly database_id?: string };
    readonly properties?: Readonly<Record<string, NotionProperty>>;
    readonly title?: readonly NotionRichTextItem[];
    readonly icon?: NotionIcon;
    readonly last_edited_time?: string;
};

/**
 * Thrown when a Notion Data API request fails. Carries the HTTP status and
 * body so the caller can map it to the right domain error, plus the parsed
 * `Retry-After` when Notion rate-limits (§14).
 */
export class NotionApiError extends Error
{
    public constructor(
        public readonly Status: number,
        public readonly Body: string,
        public readonly RetryAfterSeconds?: number
    )
    {
        super(`Notion API failed (${Status}): ${Body}`);
        this.name = "NotionApiError";
    }
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function DataApiHeaders(AccessToken: string): Record<string, string>
{
    return {
        "Authorization": `Bearer ${AccessToken}`,
        "Content-Type": "application/json",
        "Notion-Version": NotionVersion
    };
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
async function ThrowNotionApiError(Response: Response): Promise<never>
{
    const RetryAfter = Response.headers.get("retry-after");

    throw new NotionApiError(
        Response.status,
        await Response.text(),
        RetryAfter ? Number(RetryAfter) : undefined
    );
}

/**
 * Lists every data source the connection can currently see, following Notion's
 * search pagination to completion. Throws {@link NotionApiError} on failure.
 *
 * @category Notion
 * @since 1.0.0
 */
export async function SearchDataSources(AccessToken: string): Promise<readonly NotionDataSourceObject[]>
{
    const Results: NotionDataSourceObject[] = [];
    let Cursor: string | undefined;

    do
    {
        const Body: Record<string, unknown> =
        {
            filter: { property: "object", value: "data_source" },
            page_size: 100
        };

        if (Cursor)
        {
            Body.start_cursor = Cursor;
        }

        const Response = await fetch(`${ApiBase}/search`, {
            body: JSON.stringify(Body),
            headers: DataApiHeaders(AccessToken),
            method: "POST"
        });

        if (!Response.ok)
        {
            return await ThrowNotionApiError(Response);
        }

        const Page = await Response.json() as {
            readonly results?: readonly NotionDataSourceObject[];
            readonly next_cursor?: string | null;
            readonly has_more?: boolean;
        };

        for (const Result of Page.results ?? [])
        {
            Results.push(Result);
        }

        Cursor = Page.has_more && Page.next_cursor ? Page.next_cursor : undefined;
    }
    while (Cursor);

    return Results;
}

/**
 * Retrieves one data source, including its full property schema. Throws
 * {@link NotionApiError} on failure (404 when the data source is not shared
 * with, or not visible to, this connection).
 *
 * @category Notion
 * @since 1.0.0
 */
export async function RetrieveDataSource(
    AccessToken: string,
    DataSourceId: string
): Promise<NotionDataSourceObject>
{
    const Response = await fetch(`${ApiBase}/data_sources/${DataSourceId}`, {
        headers: DataApiHeaders(AccessToken),
        method: "GET"
    });

    if (!Response.ok)
    {
        return await ThrowNotionApiError(Response);
    }

    return await Response.json() as NotionDataSourceObject;
}
