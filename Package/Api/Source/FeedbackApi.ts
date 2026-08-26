/**
 * The `Feedback` group: submitting in-app feedback or a bug report. Both
 * share this single endpoint, distinguished by `Kind` — the mobile app's
 * `feedback` screen is one component reused for both, with only its
 * expo-router header text differing. Creating a row emails NoteFerry via
 * Resend (`supabase/schemas/11_notifications.sql`) and is rate-limited
 * server-side (`supabase/schemas/13_app_feedback_submissions.sql`).
 *
 * @module @noteferry/api/FeedbackApi
 *
 * @file      FeedbackApi.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Domain from "@noteferry/domain";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import { Schema } from "effect";

export/**
       * The kind of submission: open-ended feedback, or a bug report.
       *
       * @category Feedback
       * @since 1.0.0
       */
const FeedbackKind = Schema.Literals([ "Feedback", "BugReport" ]);

/** {@inheritDoc FeedbackKind} */
export type FeedbackKind = typeof FeedbackKind.Type;

export/**
       * The fields a client supplies to submit feedback or a bug report.
       *
       * @category Feedback
       * @since 1.0.0
       */
const CreateFeedbackPayload = Schema.Struct({
    Kind: FeedbackKind,
    Message: Schema.String,
    ShareContact: Schema.Boolean
});

/** {@inheritDoc CreateFeedbackPayload} */
export type CreateFeedbackPayload = typeof CreateFeedbackPayload.Type;

export/**
       * Submit feedback or a bug report for the current user.
       *
       * @category Feedback
       * @since 1.0.0
       */
const Create = HttpApiEndpoint.post(
    "Create",
    "/",
    {
        error:
        [
            Domain.Error.AuthenticationRequired,
            Domain.Error.RateLimitExceeded,
            Domain.Error.DatabaseError
        ],
        payload: CreateFeedbackPayload
    }
);

export/**
       * The `Feedback` resource group of the NoteFerry API.
       *
       * @category Feedback
       * @since 1.0.0
       */
const FeedbackApi = HttpApiGroup.make("Feedback").add(Create);
