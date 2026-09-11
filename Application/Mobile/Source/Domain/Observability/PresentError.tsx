/**
 * The single call site the rest of the app uses to handle a caught error:
 * `PresentError(error, "Context")`. Classifies it, reports it to Sentry, and
 * dispatches to the right UI channel by severity (RELEASE_CHECKLIST.md §D3):
 * `"Expected"` -> nothing (the call site already has bespoke UI for these);
 * `"Minor"` -> a `Toast`; `"Moderate"` -> the `ErrorDialog` rendered by
 * {@link PresentedErrorHost}; `"Severe"` -> `router.push("/error")`.
 *
 * `.tsx`, not the `.ts` the checklist names, because {@link PresentedErrorHost}
 * needs JSX -- that requires the `.tsx` extension for this toolchain
 * regardless of file naming intent.
 *
 * A plain function, not a `use*` hook, despite the checklist calling this
 * export "a hook" -- none of the four channels need component-local state to
 * dispatch (`Toast(...)` is already imperative, `router` is a stable module
 * import, and the `ErrorDialog` queue below is a module-level store the same
 * way `Toast.tsx` is), and several call sites that need this
 * (`oauth-callback.tsx`'s cached recovery run, `BootStore.ts`) are plain
 * async functions outside component scope, where a hook couldn't be called
 * anyway. Matching `Toast`'s shape also means one imperative-API convention
 * for the whole package instead of two.
 *
 * @module noteferry/Domain/Observability/PresentError
 *
 * @file      PresentError.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { ClassifyDomainError, type DomainErrorTag } from "./ClassifyDomainError";
import { ErrorDialog } from "@noteferry/ui/Block/ErrorDialog";
import * as React from "react";
import { FormatErrorMessage, ReportError } from "./ReportError";
import { router } from "expo-router";
import i18next from "i18next";
import { Toast } from "@noteferry/ui/Primitive/Toast";

/**
 * The `ErrorDialog` message for a Moderate-severity `DomainErrorTag`. A
 * `switch` over literal `t()` calls, rather than a `Tag -> key` lookup
 * object fed into a single dynamic `t(Key)` call, because this project's
 * `t()` is typed against the literal key union generated from `errors.json`
 * (see `i18next.d.ts`) -- a key computed at runtime as a plain `string`
 * can't type-check against that union, but every call here is a literal.
 */
const ModerateMessageFor = (Tag: DomainErrorTag | null): string =>
{
    switch (Tag)
    {
        case "AuthenticationRequired": return i18next.t("errors:moderate.authenticationRequired");
        case "DataSourceNotFound": return i18next.t("errors:moderate.dataSourceNotFound");
        case "DataSourceSchemaChanged": return i18next.t("errors:moderate.dataSourceSchemaChanged");
        case "DatabaseError": return i18next.t("errors:moderate.databaseError");
        case "DestinationNotFound": return i18next.t("errors:destinationNotFound");
        case "InvalidPageDraft": return i18next.t("errors:moderate.invalidPageDraft");
        case "NotionConnectionNotFound": return i18next.t("errors:moderate.notionConnectionNotFound");
        case "NotionConnectionRevoked": return i18next.t("errors:moderate.notionConnectionRevoked");
        case "NotionResourceNotShared": return i18next.t("errors:moderate.notionResourceNotShared");
        case "NotionUnauthorized": return i18next.t("errors:moderate.notionUnauthorized");
        case "NotionValidationError": return i18next.t("errors:moderate.notionValidationError");
        case "PageCreationInProgress": return i18next.t("errors:pageCreationInProgress");
        default: return i18next.t("errors:generic");
    }
};

// -----------------------------------------------------------------------
// ErrorDialog queue — a module-level singleton + subscriber set, the same
// pattern `Toast.tsx` uses for the same reason: a queue of pending errors is
// inherently a mutable, externally-observed store, not `Effect`/`Layer`
// state.
// -----------------------------------------------------------------------

let PendingMessage: string | null = null;
const Listeners = new Set<(Message: string | null) => void>();

const NotifyListeners = (): void =>
{
    for (const Listener of Listeners)
    {
        Listener(PendingMessage);
    }
};

const DismissErrorDialog = (): void =>
{
    PendingMessage = null;
    NotifyListeners();
};

const QueueErrorDialog = (Message: string): void =>
{
    PendingMessage = Message;
    NotifyListeners();
};

// -----------------------------------------------------------------------
// Severe error-detail stash — a one-shot handoff to `App/error.tsx`, not a
// subscribed store like the two above: `PresentError`'s Severe branch sets
// this immediately before `router.push("/error")`, and the freshly-mounted
// route consumes (reads and clears) it once. Not reactive because nothing
// needs it to be -- the value is set-then-immediately-navigated, never
// updated while `error.tsx` is already on screen.
// -----------------------------------------------------------------------

let PendingSevereErrorDetail: string | null = null;

export/**
       * Reads and clears the error detail {@link PresentError} stashed for the
       * Severe path, for `App/error.tsx`'s collapsible detail section.
       * Consumed once so a later, unrelated visit to `/error` (e.g. back
       * navigation) doesn't show a stale message.
       *
       * @category Observability
       * @since 1.0.0
       */
const ConsumeSevereErrorDetail = (): string | null =>
{
    const Detail = PendingSevereErrorDetail;

    PendingSevereErrorDetail = null;

    return Detail;
};

export/**
       * Mount once, near the app root (alongside `<Toaster>`), to render
       * whatever `PresentError` queues for Moderate-severity errors.
       *
       * @category Component
       * @since 1.0.0
       */
const PresentedErrorHost = (): React.JSX.Element =>
{
    const [ Message, SetMessage ] = React.useState(PendingMessage);

    React.useEffect(() =>
    {
        Listeners.add(SetMessage);
        return () => { Listeners.delete(SetMessage); };
    }, [ ]);

    return (
        <ErrorDialog
            Message={ Message ?? "" }
            OnOpenChange={ (Open: boolean) =>
            {
                if (!Open)
                {
                    DismissErrorDialog();
                }
            } }
            Open={ Message !== null }
            Primary={ { Label: i18next.t("errors:dialog.dismiss"), OnPress: DismissErrorDialog } }
            Title={ i18next.t("errors:dialog.title") }
        />
    );
};

export/**
       * Classifies, reports, and presents a caught error -- see the module
       * doc for the severity -> channel mapping. `Context` is a short label
       * (e.g. `"CreatePage"`) identifying the call site, forwarded to
       * `ReportError` as a Sentry tag.
       *
       * @category Observability
       * @since 1.0.0
       */
const PresentError = (InError: unknown, Context?: string): void =>
{
    const Classified = ClassifyDomainError(InError);

    ReportError(InError, Classified.Severity, Context);

    switch (Classified.Severity)
    {
        case "Expected":
            return;
        case "Minor":
            Toast.Warning(i18next.t("errors:minor.networkHiccup"));
            return;
        case "Moderate":
            QueueErrorDialog(ModerateMessageFor(Classified.Tag));
            return;
        case "Severe":
            PendingSevereErrorDetail = FormatErrorMessage(InError);
            router.push("/error");
            return;
    }
};
