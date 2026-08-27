/**
 * Schema-backed tagged errors for every failure mode the rest of NoteFerry
 * needs to distinguish. Nothing downstream should ever see a raw exception
 * from Supabase, `fetch`, Deno, or the Notion SDK — adapters translate those
 * into one of these instead, so callers can write
 * `Effect.catchTag("NotionRateLimited", ...)` rather than inspecting an HTTP
 * status code.
 *
 * Each error also carries an `httpApiStatus` annotation. When these errors are
 * used as an `HttpApiEndpoint` failure schema, Effect's HttpApi tooling reads
 * that annotation to choose the response status (equivalent to
 * `HttpApiSchema.status(code)`); without it every tagged error would encode as
 * a 500. The annotation is inert metadata everywhere else — the domain stays
 * free of any HTTP dependency.
 *
 * @module @noteferry/domain/Error
 *
 * @file      Error.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Id from "./Id.js";
import * as Schema from "effect/Schema";

/**
 * No Supabase session is present, or it could not be verified.
 *
 * @category Error
 * @since 1.0.0
 */
export class AuthenticationRequired extends Schema.TaggedError<AuthenticationRequired>()(
    "AuthenticationRequired",
    { },
    { httpApiStatus: 401 }
) { }

/**
 * The referenced Notion connection does not exist (or does not belong to
 * the current user).
 *
 * @category Error
 * @since 1.0.0
 */
export class NotionConnectionNotFound extends Schema.TaggedError<NotionConnectionNotFound>()(
    "NotionConnectionNotFound",
    { ConnectionId: Id.NotionConnectionId },
    { httpApiStatus: 404 }
) { }

/**
 * The referenced Notion connection exists but its authorization has been
 * revoked, either by the user or by Notion.
 *
 * @category Error
 * @since 1.0.0
 */
export class NotionConnectionRevoked extends Schema.TaggedError<NotionConnectionRevoked>()(
    "NotionConnectionRevoked",
    { ConnectionId: Id.NotionConnectionId },
    { httpApiStatus: 409 }
) { }

/**
 * A Notion resource (typically a relation target database) was referenced
 * but has not been shared with this connection, so Notion will not return
 * its schema.
 *
 * @category Error
 * @since 1.0.0
 */
export class NotionResourceNotShared extends Schema.TaggedError<NotionResourceNotShared>()(
    "NotionResourceNotShared",
    { DataSourceId: Schema.optional(Id.NotionDataSourceId) },
    { httpApiStatus: 403 }
) { }

/**
 * Notion rejected the request as unauthorized (HTTP 401) for a reason other
 * than a revoked connection, e.g. an access token that failed to refresh.
 *
 * @category Error
 * @since 1.0.0
 */
export class NotionUnauthorized extends Schema.TaggedError<NotionUnauthorized>()(
    "NotionUnauthorized",
    { Message: Schema.optional(Schema.String) },
    { httpApiStatus: 502 }
) { }

/**
 * Notion rejected the request with HTTP 429. Carries the `Retry-After`
 * value when Notion provided one.
 *
 * @category Error
 * @since 1.0.0
 */
export class NotionRateLimited extends Schema.TaggedError<NotionRateLimited>()(
    "NotionRateLimited",
    { RetryAfterSeconds: Schema.optional(Schema.Number) },
    { httpApiStatus: 429 }
) { }

/**
 * Notion rejected the request body as invalid, e.g. a property value that
 * does not conform to the data source's current schema.
 *
 * @category Error
 * @since 1.0.0
 */
export class NotionValidationError extends Schema.TaggedError<NotionValidationError>()(
    "NotionValidationError",
    { Message: Schema.String },
    { httpApiStatus: 422 }
) { }

/**
 * Notion returned a server error (HTTP 5xx) or otherwise appears to be
 * unavailable.
 *
 * @category Error
 * @since 1.0.0
 */
export class NotionUnavailable extends Schema.TaggedError<NotionUnavailable>()(
    "NotionUnavailable",
    { Message: Schema.optional(Schema.String) },
    { httpApiStatus: 503 }
) { }

/**
 * The referenced Notion data source does not exist, or is no longer
 * accessible to this connection.
 *
 * @category Error
 * @since 1.0.0
 */
export class DataSourceNotFound extends Schema.TaggedError<DataSourceNotFound>()(
    "DataSourceNotFound",
    { DataSourceId: Id.NotionDataSourceId },
    { httpApiStatus: 404 }
) { }

/**
 * The cached {@link DataSource.CachedDataSourceSchema} no longer matches
 * Notion's current schema for this data source and must be refreshed before
 * the affected destination can be used.
 *
 * @category Error
 * @since 1.0.0
 */
export class DataSourceSchemaChanged extends Schema.TaggedError<DataSourceSchemaChanged>()(
    "DataSourceSchemaChanged",
    { DataSourceId: Id.NotionDataSourceId },
    { httpApiStatus: 409 }
) { }

/**
 * The referenced destination does not exist, or does not belong to the
 * current user.
 *
 * @category Error
 * @since 1.0.0
 */
export class DestinationNotFound extends Schema.TaggedError<DestinationNotFound>()(
    "DestinationNotFound",
    { DestinationId: Id.DestinationId },
    { httpApiStatus: 404 }
) { }

/**
 * A {@link PageDraft.PageDraft} failed NoteFerry-side validation before it was
 * ever sent to Notion.
 *
 * @category Error
 * @since 1.0.0
 */
export class InvalidPageDraft extends Schema.TaggedError<InvalidPageDraft>()(
    "InvalidPageDraft",
    { Message: Schema.String },
    { httpApiStatus: 422 }
) { }

/**
 * This exact page-creation operation (matched by its idempotency key) is
 * already being processed by a concurrent or very recent request. Distinct
 * from {@link NotionUnavailable} — Notion itself is reachable, the operation
 * is just already in flight.
 *
 * @category Error
 * @since 1.0.0
 */
export class PageCreationInProgress extends Schema.TaggedError<PageCreationInProgress>()(
    "PageCreationInProgress",
    { },
    { httpApiStatus: 409 }
) { }

/**
 * A Postgres/Supabase operation failed.
 *
 * @category Error
 * @since 1.0.0
 */
export class DatabaseError extends Schema.TaggedError<DatabaseError>()(
    "DatabaseError",
    { Message: Schema.String },
    { httpApiStatus: 500 }
) { }

/**
 * A request could not complete due to a network failure, as distinct from
 * the remote service returning an error response.
 *
 * @category Error
 * @since 1.0.0
 */
export class NetworkError extends Schema.TaggedError<NetworkError>()(
    "NetworkError",
    { Message: Schema.String },
    { httpApiStatus: 502 }
) { }

/** A client attempted to use a feature that requires NoteFerry Pro. */
export class FeatureGateError extends Schema.TaggedError<FeatureGateError>()(
    "FeatureGateError",
    { Feature: Schema.String },
    { httpApiStatus: 403 }
) { }

/** The free rolling page-creation allowance is currently exhausted. */
export class FreeCreationWindowExceeded extends Schema.TaggedError<FreeCreationWindowExceeded>()(
    "FreeCreationWindowExceeded",
    { NextAvailableAt: Schema.DateFromString },
    { httpApiStatus: 429 }
) { }

/** A free account attempted to activate more than three databases. */
export class FreeDatabaseLimitReached extends Schema.TaggedError<FreeDatabaseLimitReached>()(
    "FreeDatabaseLimitReached",
    { Limit: Schema.Number },
    { httpApiStatus: 409 }
) { }

/**
 * The current user has submitted too many feedback/bug reports recently
 * (`private.enforce_feedback_rate_limit`, `supabase/schemas/13_app_feedback_submissions.sql`).
 *
 * @category Error
 * @since 1.0.0
 */
export class RateLimitExceeded extends Schema.TaggedError<RateLimitExceeded>()(
    "RateLimitExceeded",
    { },
    { httpApiStatus: 429 }
) { }

export/**
       * The union of every domain error, for callers that want a single type to
       * match against.
       *
       * @category Error
       * @since 1.0.0
       */
const DomainError = Schema.Union([
    AuthenticationRequired,
    NotionConnectionNotFound,
    NotionConnectionRevoked,
    NotionResourceNotShared,
    NotionUnauthorized,
    NotionRateLimited,
    NotionValidationError,
    NotionUnavailable,
    DataSourceNotFound,
    DataSourceSchemaChanged,
    DestinationNotFound,
    InvalidPageDraft,
    PageCreationInProgress,
    DatabaseError,
    NetworkError,
    FeatureGateError,
    FreeCreationWindowExceeded,
    FreeDatabaseLimitReached,
    RateLimitExceeded
]);

/** {@inheritDoc DomainError} */
export type DomainError = Schema.Schema.Type<typeof DomainError>;
