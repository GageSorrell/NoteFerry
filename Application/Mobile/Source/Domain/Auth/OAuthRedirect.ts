/**
 * Shared native OAuth browser and redirect configuration.
 *
 * @module notivex/Domain/Auth/OAuthRedirect
 *
 * @file      OAuthRedirect.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/** Deep link returned by Supabase after Notion identity authentication. */
export const IdentityReturnUrl = "notivex://auth/callback" as const;

/** Deep link returned by the server after Notion content authorization. */
export const NotionConnectedReturnUrl = "notivex://notion/connected" as const;

/** The OAuth callback recognized from an incoming native URL. */
export type OAuthCallbackKind = "Identity" | "NotionConnection";

let PendingInitialCallbackUrl: string | null = null;

/** Classifies only the two callback URLs owned by Notivex OAuth flows. */
export const GetOAuthCallbackKind = (Url: string): OAuthCallbackKind | null =>
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

/** Stores a cold-start callback outside router state so tokens never become route params. */
export const SetPendingInitialOAuthCallback = (Url: string): void =>
{
    PendingInitialCallbackUrl = Url;
};

/** Returns the callback captured before the route tree mounted. */
export const GetPendingInitialOAuthCallback = (): string | null => PendingInitialCallbackUrl;

/** Clears the callback after its recovery route has chosen a destination. */
export const ClearPendingInitialOAuthCallback = (Url: string | null): void =>
{
    if (Url === PendingInitialCallbackUrl)
    {
        PendingInitialCallbackUrl = null;
    }
};
