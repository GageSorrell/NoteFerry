/**
 * Server-only feedback/bug-report creation (Deno + Effect). Inserting a row
 * fires the `feedback_submissions_notify` Postgres trigger
 * (`supabase/schemas/11_notifications.sql`), which emails Notivex so it can
 * be triaged by hand — nothing else happens here. A `before insert` trigger
 * on the table itself (`private.enforce_feedback_rate_limit`,
 * `supabase/schemas/13_app_feedback_submissions.sql`) enforces a basic
 * per-user rate limit; its rejection is translated into
 * {@link Domain.Error.RateLimitExceeded} below.
 *
 * @module notivex/functions/_shared/Feedback
 *
 * @file      Feedback.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@notivex/domain";
import { AdminClient } from "./Database.ts";
import { Effect } from "effect";
import type { FeedbackApi } from "@notivex/api";

/**
 * Records a feedback or bug-report submission for the current user.
 *
 * @category Feedback
 * @since 1.0.0
 */
export function CreateForUser(UserId: string, Input: FeedbackApi.CreateFeedbackPayload)
{
    return Effect.gen(function* ()
    {
        const { error } = yield* Effect.promise(async () =>
            await AdminClient
                .from("feedback_submissions")
                .insert({
                    kind: Input.Kind === "BugReport" ? "bug_report" : "feedback",
                    message: Input.Message,
                    share_contact: Input.ShareContact,
                    user_id: UserId
                }));

        if (error)
        {
            if (error.message.includes("RATE_LIMIT_EXCEEDED"))
            {
                return yield* Effect.fail(new Domain.Error.RateLimitExceeded());
            }

            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
        }
    });
}
