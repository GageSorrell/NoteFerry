/**
 * Read models for pages created through NoteFerry.
 *
 * @module @noteferry/domain/Page
 */

import * as Id from "./Id.js";
import * as Schema from "effect/Schema";

/** A normalized page entry shown in Home's Recent section. */
export const RecentPage = Schema.Struct({
    CoverUrl: Schema.optional(Schema.String),
    CreatedAt: Schema.DateFromString,
    DatabaseName: Schema.optional(Schema.String),
    Icon: Schema.optional(Schema.String),
    IconType: Schema.optional(Schema.Literals([ "Emoji", "Image", "Native" ])),
    NotionPageId: Id.NotionPageId,
    OperationId: Id.OperationId,
    Title: Schema.String,
    Url: Schema.String
});

/** {@inheritDoc RecentPage} */
export type RecentPage = Schema.Schema.Type<typeof RecentPage>;
