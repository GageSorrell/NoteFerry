/**
 * The root error boundary for Severe errors (RELEASE_CHECKLIST.md §D3):
 * wraps `<Stack>` in `_layout.tsx` and catches a synchronous render-time
 * crash anywhere below it. `componentDidCatch` reports via `ReportError`
 * with `"Severe"`, then renders `SevereErrorScreen` inline -- a class
 * component, per React's error-boundary requirement (no hook equivalent
 * exists for `componentDidCatch`/`getDerivedStateFromError`).
 *
 * Deliberately does *not* navigate to `App/error.tsx` for this case: a tree
 * that just threw during render is in an unknown state, and `expo-router`'s
 * navigation depends on that same React tree being healthy. `PresentError`'s
 * *async* Severe path (an error caught in a `.catch()`, not a render throw)
 * uses `router.push("/error")` instead, where the tree is fine and
 * navigation can be trusted -- see `App/error.tsx`'s doc comment.
 *
 * "Retry" here resets local `HasError` state to re-render `children` fresh,
 * rather than reloading the app -- there's no reliable full-reload API in a
 * production (non-`__DEV__`) build, and simply re-rendering is enough to
 * recover from a crash caused by transient bad state (e.g. a bad
 * navigation param) rather than a deterministic bug.
 *
 * @module noteferry/Component/ErrorBoundary
 *
 * @file      ErrorBoundary.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { FormatErrorMessage, ReportError } from "@/Domain/Observability";
import { SevereErrorScreen } from "./SevereErrorScreen";

interface ErrorBoundaryState
{
    readonly HasError: boolean;
    readonly ErrorDetail: string | null;
}

export/**
       * @category Component
       * @since 1.0.0
       */
class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState>
{
    public override state: ErrorBoundaryState = { ErrorDetail: null, HasError: false };

    public static getDerivedStateFromError(CaughtError: unknown): ErrorBoundaryState
    {
        return { ErrorDetail: FormatErrorMessage(CaughtError), HasError: true };
    }

    public override componentDidCatch(CaughtError: Error): void
    {
        ReportError(CaughtError, "Severe", "ErrorBoundary");
    }

    private readonly OnRetry = (): void =>
    {
        this.setState({ ErrorDetail: null, HasError: false });
    };

    public override render(): React.ReactNode
    {
        if (this.state.HasError)
        {
            return (
                <SevereErrorScreen
                    ErrorDetail={ this.state.ErrorDetail ?? undefined }
                    OnRetry={ this.OnRetry }
                />
            );
        }

        return this.props.children;
    }
}
