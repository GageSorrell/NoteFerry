/**
 * Shared native OAuth browser and redirect configuration.
 *
 * @module noteferry/Domain/Auth/OAuthRedirect
 *
 * @file      OAuthRedirect.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export/** Deep link returned by Supabase after Notion identity authentication. */
const IdentityReturnUrl = "noteferry://auth/callback" as const;

export/** Deep link returned by the server after Notion content authorization. */
const NotionConnectedReturnUrl = "noteferry://notion/connected" as const;

/* eslint-disable @typescript-eslint/naming-convention */

/** The OAuth callback recognized from an incoming native URL. */
export type OAuthCallbackKind =
    | "Identity"
    | "NotionConnection";

/* eslint-enable @typescript-eslint/naming-convention */

let PendingInitialCallbackUrl: string | null = null;

export/** Classifies only the two callback URLs owned by Notivex OAuth flows. */
const GetOAuthCallbackKind = (Url: string): OAuthCallbackKind | null =>
{
    try
    {
        const Parsed = new URL(Url);
        const Callback = `${ Parsed.protocol }//${ Parsed.host }${ Parsed.pathname }`;

        if (Callback === IdentityReturnUrl)
        {
            return "Identity";
        }

        if (Callback === NotionConnectedReturnUrl)
        {
            return "NotionConnection";
        }
    }
    catch
    {
        /* Native intents are not guaranteed to contain a valid URL. */
    }

    return null;
};

export/** Stores a cold-start callback outside router state so tokens never become route params. */
const SetPendingInitialOAuthCallback = (Url: string): void =>
{
    PendingInitialCallbackUrl = Url;
};

export/** Returns the callback captured before the route tree mounted. */
const GetPendingInitialOAuthCallback = (): string | null => PendingInitialCallbackUrl;

export/** Clears the callback after its recovery route has chosen a destination. */
const ClearPendingInitialOAuthCallback = (Url: string | null): void =>
{
    if (Url === PendingInitialCallbackUrl)
    {
        PendingInitialCallbackUrl = null;
    }
};
