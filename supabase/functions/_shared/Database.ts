/**
 * Supabase clients for the edge functions.
 *
 * The **admin** client uses the service-role key and bypasses RLS — it is the
 * only way to touch the `private.*` schema (tokens, OAuth state) and to write
 * connection metadata on the user's behalf. Because it bypasses RLS, every
 * query it runs MUST filter by the verified user id explicitly.
 *
 * @module noteferry/functions/_shared/Database
 *
 * @file      Database.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { createClient } from "@supabase/supabase-js";

const SupabaseUrl = Deno.env.get("SUPABASE_URL");
const ServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SupabaseUrl || !ServiceRoleKey)
{
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.");
}

/**
 * Service-role client. Bypasses RLS; reaches `app.*` and `private.*`. Always
 * scope queries by the caller's verified user id.
 *
 * @category Database
 * @since 1.0.0
 */
export const AdminClient = createClient(SupabaseUrl, ServiceRoleKey, {
    auth:
    {
        autoRefreshToken: false,
        persistSession: false
    },
    db: { schema: "app" }
});

/**
 * A view of the admin client bound to the `private` schema, for token and
 * OAuth-state rows the Data API never exposes.
 *
 * @category Database
 * @since 1.0.0
 */
export const PrivateSchema = createClient(SupabaseUrl, ServiceRoleKey, {
    auth:
    {
        autoRefreshToken: false,
        persistSession: false
    },
    db: { schema: "private" }
});

/**
 * Resolves the authenticated user id from a caller's bearer token, or `null`.
 * The `api` function runs with `verify_jwt = true`, so the token is already
 * platform-verified; this recovers the user record from it.
 *
 * @category Database
 * @since 1.0.0
 */
export const GetUserId = async (BearerToken: string | null): Promise<string | null> =>
{
    if (!BearerToken)
    {
        return null;
    }

    const { data, error } = await AdminClient.auth.getUser(BearerToken);

    if (error || !data.user)
    {
        return null;
    }

    return data.user.id;
};
