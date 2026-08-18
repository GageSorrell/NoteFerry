/**
 * Server-only account-data-request creation (Deno + Effect). Inserting a row
 * fires the `account_data_requests_notify` Postgres trigger
 * (`supabase/schemas/11_notifications.sql`), which emails Notivex so the
 * export can be fulfilled by hand — nothing else happens here.
 *
 * @module notivex/functions/_shared/ExportRequests
 *
 * @file      ExportRequests.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
import { AdminClient } from "./Database.ts";
import { Effect } from "effect";

/**
 * Records a request for the current user's account data.
 *
 * @category ExportRequests
 * @since 1.0.0
 */
export function CreateForUser(UserId: string)
{
    return Effect.gen(function* ()
    {
        const { error } = yield* Effect.promise(async () =>
            await AdminClient
                .from("account_data_requests")
                .insert({ user_id: UserId }));

        if (error)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
        }
    });
}
