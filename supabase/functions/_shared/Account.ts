/**
 * Server-only account deletion (Deno + Effect). Deleting the Supabase Auth
 * user cascades every `app.*` row that references it (`on delete cascade` on
 * `profiles`, `notion_connections`, `destinations`, `operations`,
 * `account_data_requests`) — no manual cleanup needed here.
 *
 * @module noteferry/functions/_shared/Account
 *
 * @file      Account.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@noteferry/domain";
import { AdminClient } from "./Database.ts";
import { Effect } from "effect";

/**
 * Permanently deletes the current user's Supabase Auth user.
 * This is irreversible.
 *
 * @category Account
 * @since 1.0.0
 */
export const DeleteForUser = (UserId: string) =>
{
    return Effect.gen(function* ()
    {
        const { error } = yield* Effect.promise(async () =>
            await AdminClient.auth.admin.deleteUser(UserId));

        if (error)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
        }
    });
};
