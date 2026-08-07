/**
 * The Effect-facing seam for "who is the current Notivex user?"
 * (ArchitectureInitialDraft.md §15, §35). Application code depends on this
 * `CurrentUser` service rather than on `supabase-js` directly, so the same use
 * cases can run against a test user in unit tests.
 *
 * @module notivex/runtime/current-user
 *
 * @file      current-user.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
import { Context, Effect } from "effect";
import { Supabase } from "./supabase";
import type { UserResponse } from "@supabase/supabase-js";

/**
 * Provides the id of the authenticated Supabase user, or fails with
 * {@link Domain.Error.AuthenticationRequired} when no session is present.
 *
 * @category Runtime
 * @since 1.0.0
 */
export class CurrentUser extends Context.Service<CurrentUser, {
    readonly UserId: Effect.Effect<Domain.Id.UserId, Domain.Error.AuthenticationRequired>;
}>()("CurrentUser") { }

export/**
       * The production implementation, backed by the app's Supabase session.
       *
       * @category Runtime
       * @since 1.0.0
       */
const CurrentUserLive = Context.make(CurrentUser, {
    UserId: Effect.flatMap(
        Effect.promise(() => Supabase.auth.getUser()),
        (Response: UserResponse) => Response.data.user
            ? Effect.succeed(Response.data.user.id as Domain.Id.UserId)
            : Effect.fail(new Domain.Error.AuthenticationRequired())
    )
});
