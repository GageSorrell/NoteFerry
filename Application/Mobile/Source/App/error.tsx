/**
 * Full-screen fallback for Severe errors -- boot failure, i18n init failure,
 * or an uncaught render exception (RELEASE_CHECKLIST.md §D3). Registered
 * outside every `Stack.Protected` guard in `_layout.tsx` (like
 * `oauth-callback.tsx`) so it's reachable regardless of auth state -- a
 * Severe error can happen before a session is known either way.
 *
 * This is `PresentError`'s async Severe path (`router.push("/error")`),
 * where navigation still works, so "retry" here means navigating back to the
 * app root. `ErrorBoundary.tsx` renders the same `SevereErrorScreen` inline
 * for a synchronous render-time crash instead, where navigation can't be
 * trusted -- see that file's doc comment.
 *
 * @module noteferry/app/error
 *
 * @file      error.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { ConsumeSevereErrorDetail } from "@/Domain/Observability";
import type React from "react";
import { SevereErrorScreen } from "@/Component";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useState } from "react";

const ErrorScreen = (): React.JSX.Element =>
{
    const Router = useLazyRouter();

    /* Read once, on mount -- `PresentError` stashed this immediately before
     * navigating here (see its doc comment). Captured in `useState`'s lazy
     * initializer rather than read directly in render so it survives this
     * component re-rendering for other reasons without being re-consumed
     * (the stash clears itself on read). */
    const [ ErrorDetail ] = useState(ConsumeSevereErrorDetail);

    return (
        <SevereErrorScreen
            ErrorDetail={ ErrorDetail ?? undefined }
            OnRetry={ Router.replace("/") }
        />
    );
};

export default ErrorScreen;
