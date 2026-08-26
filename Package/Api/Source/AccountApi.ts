/**
 * The `Account` group: permanently deleting the current user's account.
 *
 * @module @noteferry/api/AccountApi
 *
 * @file      AccountApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@noteferry/domain";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

export/**
       * Permanently delete the current user's Supabase Auth user. Every
       * `app.*` row owned by the user cascades away with it.
       *
       * @category Account
       * @since 1.0.0
       */
const Delete = HttpApiEndpoint.delete(
    "Delete",
    "/",
    {
        error:
        [
            Domain.Error.AuthenticationRequired,
            Domain.Error.DatabaseError
        ]
    }
);

export/**
       * The `Account` resource group of the NoteFerry API.
       *
       * @category Account
       * @since 1.0.0
       */
const AccountApi = HttpApiGroup.make("Account").add(Delete);
