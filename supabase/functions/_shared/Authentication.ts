/**
 * Server-side "who is calling?" for the `api` edge function. The function runs
 * with `verify_jwt = true`, so the platform has already validated the bearer
 * token; this recovers the Notivex user id from it and fails with
 * {@link Domain.Error.AuthenticationRequired} when it is missing or invalid.
 *
 * Mirrors the app-side seam in `Application/Mobile/Source/Domain/Runtime/CurrentUser.ts`.
 *
 * @module notivex/functions/_shared/Authentication
 *
 * @file      Authentication.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
import { Effect } from "effect";
import { GetUserId } from "./Database.ts";
import { HttpServerRequest } from "effect/unstable/http";

/**
 * Yields the authenticated user's id from the request's `Authorization`
 * header, or fails with `AuthenticationRequired`.
 *
 * @category Authentication
 * @since 1.0.0
 */
export const RequireUser: Effect.Effect<
    Domain.Id.UserId,
    Domain.Error.AuthenticationRequired,
    HttpServerRequest.HttpServerRequest
> = Effect.gen(function* ()
{
    const Request = yield* HttpServerRequest.HttpServerRequest;
    const Header = Request.headers["authorization"];
    const Token = Header ? Header.replace(/^Bearer\s+/i, "") : null;
    const UserId = yield* Effect.promise(() => GetUserId(Token));

    if (!UserId)
    {
        return yield* Effect.fail(new Domain.Error.AuthenticationRequired());
    }

    return UserId as Domain.Id.UserId;
});
