/**
 * Calls the existing, authenticated `DELETE /Account/` endpoint that the
 * mobile app already uses (`Package/Api/Source/AccountApi.ts`,
 * `supabase/functions/_shared/Account.ts`) — a real, immediate, cascading
 * deletion, not a queued request. A plain `fetch`, not the Effect-based
 * typed client the mobile app builds
 * (`Application/Mobile/Source/Domain/Runtime/NoteFerryApi.ts`'s
 * `MakeClient`): pulling in `@noteferry/api`/Effect for this one call would
 * be a heavy addition to a site that has otherwise stayed dependency-light.
 *
 * @file      delete-account.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

const SupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * Permanently deletes the signed-in user's NoteFerry account. Throws if the
 * request fails.
 *
 * @category DeleteAccount
 * @since 1.0.0
 */
export const DeleteAccount = async (AccessToken: string): Promise<void> =>
{
    const Response_ = await fetch(`${ SupabaseUrl }/functions/v1/api/Account/`, {
        headers: { Authorization: `Bearer ${ AccessToken }` },
        method: "DELETE"
    });

    if (!Response_.ok)
    {
        throw new Error(`Account deletion failed (${ Response_.status })`);
    }
};
