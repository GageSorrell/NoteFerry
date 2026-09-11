/**
 * The single place that talks to Sentry about a caught error, given the
 * severity {@link ClassifyDomainError} (or an explicit call site) assigned
 * it. `"Expected"` errors get a breadcrumb only -- no `captureException`, no
 * dashboard noise for conditions the UI already has bespoke handling for
 * (rate limits, free-tier gates, ...). Everything else is captured, tagged
 * with `Severity` and `Context` so Sentry issues can be filtered/triaged by
 * either.
 *
 * @module noteferry/Domain/Observability/ReportError
 *
 * @file      ReportError.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { ErrorSeverity } from "./ClassifyDomainError";
import * as Sentry from "@sentry/react-native";

const BreadcrumbLevelBySeverity: Readonly<Record<ErrorSeverity, Sentry.SeverityLevel>> =
    Object.freeze({
        Expected: "info",
        Minor: "warning",
        Moderate: "error",
        Severe: "fatal"
    } as const);

export/**
       * Best-effort message extraction -- never throws, `ReportError` must not
       * itself fail inside a `catch`. Exported for `PresentError.tsx`'s Severe
       * path, which stashes this same text for `SevereErrorScreen`'s
       * collapsible error-detail section.
       *
       * @category Observability
       * @since 1.0.0
       */
const FormatErrorMessage = (InError: unknown): string =>
{
    if (InError instanceof Error)
    {
        return InError.message;
    }

    if (typeof InError === "object" && InError !== null && "message" in InError
        && typeof (InError as { message: unknown }).message === "string")
    {
        return (InError as { message: string }).message;
    }

    return String(InError);
};

export/**
       * Reports an already-classified error to Sentry: always a breadcrumb,
       * plus `captureException` for anything above `"Expected"`. Context is a
       * short free-text label (e.g. `"CreatePage"`, `"SignIn"`) rather than a
       * structured object -- every call site so far only needs to say *where*
       * the error happened, which reads better as a Sentry tag than as a
       * flattened object of unpredictable shape.
       *
       * @category Observability
       * @since 1.0.0
       */
const ReportError = (InError: unknown, Severity: ErrorSeverity, Context?: string): void =>
{
    Sentry.addBreadcrumb({
        category: "error",
        data: Context === undefined ? undefined : { Context },
        level: BreadcrumbLevelBySeverity[ Severity ],
        message: FormatErrorMessage(InError)
    });

    if (Severity === "Expected")
    {
        return;
    }

    Sentry.captureException(InError, {
        tags: {
            Context: Context ?? "Unknown",
            Severity
        }
    });
};
