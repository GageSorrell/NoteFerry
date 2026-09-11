/**
 * Walks an unknown thrown value looking for a NoteFerry {@link Domain.Error.DomainError}
 * and assigns it a severity tier, consolidating the `FindTaggedError` walker
 * that used to be copy-pasted in `create-page.tsx` and `feedback.tsx` (see
 * RELEASE_CHECKLIST.md §D3).
 *
 * The walker exists because a `DomainError` rarely reaches a `catch` block
 * as-is — Effect wraps it in a `FiberFailure`/`Cause`, and some call paths
 * wrap it again (e.g. `Promise` rejection chains) — so this does a bounded
 * breadth-first search through `.cause`/`.error`/`.failure` looking for the
 * first object with a string `_tag`, the same heuristic both original copies
 * used.
 *
 * Severity assignment is a judgment call the checklist didn't fully
 * enumerate — it named the four {@link ErrorSeverity} `"Expected"` tags and
 * the `"Moderate"` set verbatim, but described `"Minor"` only by example
 * ("recoverable/non-blocking, e.g. background sync/network hiccups"). The
 * remaining tags are placed here by that same rubric:
 * - `"Minor"`: transient/retryable network conditions (`NetworkError`,
 *   `NotionUnavailable`, `NotionRateLimited`) — the same shape as the
 *   checklist's own example.
 * - `"Moderate"`: the checklist's explicit list, plus `NotionConnectionNotFound`,
 *   `NotionResourceNotShared`, `NotionValidationError`, and `DataSourceNotFound`
 *   — each blocks the current action without making the app unusable, the
 *   same way the checklist's own `DestinationNotFound`/`InvalidPageDraft` do.
 *
 * `"Severe"` is deliberately not derived here — per the checklist it covers
 * boot failure, i18n init failure, and uncaught render exceptions, none of
 * which are a `DomainError`. Those call `ReportError`/`PresentError` with an
 * explicit `"Severe"` instead of going through this classifier.
 *
 * @module noteferry/Domain/Observability/ClassifyDomainError
 *
 * @file      ClassifyDomainError.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";

/**
 * Every `DomainError._tag`, for a switch/lookup table that stays exhaustive
 * against `Package/Domain/Source/Error.ts` at compile time.
 *
 * @category Observability
 * @since 1.0.0
 */
export type DomainErrorTag = Domain.Error.DomainError["_tag"];

/**
 * How urgently a caught error needs the user's or Sentry's attention.
 *
 * @category Observability
 * @since 1.0.0
 */
export type ErrorSeverity =
    | "Expected"
    | "Minor"
    | "Moderate"
    | "Severe";

/**
 * The result of classifying an unknown thrown value.
 *
 * @category Observability
 * @since 1.0.0
 */
export interface ClassifiedError
{
    /** The `DomainError` record found while walking `InError`, if any. */
    readonly TaggedError: Record<string, unknown> | null;

    /** {@inheritDoc TaggedError}'s `_tag`, or `null` if none was found. */
    readonly Tag: DomainErrorTag | null;

    /** {@inheritDoc ErrorSeverity} */
    readonly Severity: ErrorSeverity;
}

const SeverityByTag: Readonly<Record<DomainErrorTag, ErrorSeverity>> =
    Object.freeze({
        AuthenticationRequired: "Moderate",
        DataSourceNotFound: "Moderate",
        DataSourceSchemaChanged: "Moderate",
        DatabaseError: "Moderate",
        DestinationNotFound: "Moderate",
        FeatureGateError: "Expected",
        FreeCreationWindowExceeded: "Expected",
        FreeDatabaseLimitReached: "Expected",
        InvalidPageDraft: "Moderate",
        NetworkError: "Minor",
        NotionConnectionNotFound: "Moderate",
        NotionConnectionRevoked: "Moderate",
        NotionRateLimited: "Minor",
        NotionResourceNotShared: "Moderate",
        NotionUnauthorized: "Moderate",
        NotionUnavailable: "Minor",
        NotionValidationError: "Moderate",
        PageCreationInProgress: "Moderate",
        RateLimitExceeded: "Expected"
    } as const);

/** Every `DomainErrorTag`, used to recognize a found tagged record as one. */
const KnownTags = new Set<string>(Object.keys(SeverityByTag));

/**
 * Bounded breadth-first search through `.cause`/`.error`/`.failure` for the
 * first object carrying a string `_tag`. Not `DomainError`-specific by
 * itself -- {@link ClassifyDomainError} is what checks the tag against
 * {@link KnownTags}.
 */
const FindTaggedError = (InError: unknown): Record<string, unknown> | null =>
{
    const Seen = new Set<unknown>();
    const Queue: unknown[] = [ InError ];

    while (Queue.length > 0)
    {
        const Current = Queue.shift();

        if (!Current || typeof Current !== "object" || Seen.has(Current))
        {
            continue;
        }

        Seen.add(Current);
        const CurrentRecord = Current as Record<string, unknown>;

        if (typeof CurrentRecord._tag === "string")
        {
            return CurrentRecord;
        }

        Queue.push(CurrentRecord.cause, CurrentRecord.error, CurrentRecord.failure);
    }

    return null;
};

export/**
       * Classifies an unknown thrown value for `ReportError`/`PresentError`.
       * A `DomainError` not in {@link SeverityByTag} (impossible if this file
       * stays in sync with `Error.ts`, but TypeScript can't prove that from a
       * `string` tag pulled off an `unknown`) and any non-`DomainError`
       * both classify as `"Moderate"`, matching the checklist's "any
       * untagged/unknown error" rule.
       *
       * @category Observability
       * @since 1.0.0
       */
const ClassifyDomainError = (InError: unknown): ClassifiedError =>
{
    const TaggedError = FindTaggedError(InError);
    const Tag = TaggedError !== null && KnownTags.has(TaggedError._tag as string)
        ? (TaggedError._tag as DomainErrorTag)
        : null;

    return {
        Severity: Tag === null ? "Moderate" : SeverityByTag[ Tag ],
        Tag,
        TaggedError
    };
};
