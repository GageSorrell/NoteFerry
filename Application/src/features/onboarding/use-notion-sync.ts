/**
 * Polls Notion discovery while onboarding waits for freshly shared pages to
 * appear. After the grant step Notion can lag ~30s before `/search` reflects
 * what the user shared, so this hook checks calmly within that window rather
 * than failing fast (ArchitectureInitialDraft.md §16).
 *
 * @module notivex/features/onboarding/use-notion-sync
 *
 * @file      use-notion-sync.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { useCallback, useEffect, useState } from "react";
import { SearchDataSources } from "@/Domain/Runtime/NotivexApi";

/* How often to re-check, and how long to keep waiting before giving up. */
const PollIntervalMs = 3000 as const;
const CeilingMs = 30000 as const;

/**
 * The state of the post-grant wait for Notion to share the user's pages.
 *
 * @category Onboarding
 * @since 1.0.0
 */
export type NotionSyncStatus =
    | "Syncing"
    | "Ready"
    | "Empty"
    | "Error";

/** {@inheritDoc useNotionSync} */
export interface UseNotionSync
{
    readonly Status: NotionSyncStatus;
    readonly Count: number;
    readonly Retry: () => void;
}

/**
 * Polls Notion discovery for `ConnectionId` until at least one data source
 * appears (`Ready`), the ~30s window elapses with none found (`Empty`), or the
 * window elapses after a request error (`Error`). `Retry` starts the wait over.
 *
 * @category Onboarding
 * @since 1.0.0
 */
export function useNotionSync(ConnectionId: Domain.Id.NotionConnectionId): UseNotionSync
{
    const [ Status, SetStatus ] = useState<NotionSyncStatus>("Syncing");
    const [ Count, SetCount ] = useState(0);
    const [ Attempt, SetAttempt ] = useState(0);

    useEffect(() =>
    {
        let Cancelled = false;
        let Timer: ReturnType<typeof setTimeout> | undefined;
        let SawError = false;
        const StartedAt = Date.now();

        SetStatus("Syncing");
        SetCount(0);

        const Poll = async (): Promise<void> =>
        {
            try
            {
                const Result = await SearchDataSources(ConnectionId);

                if (Cancelled)
                {
                    return;
                }

                if (Result.length > 0)
                {
                    SetCount(Result.length);
                    SetStatus("Ready");

                    return;
                }

                SawError = false;
            }
            catch (Error)
            {
                if (Cancelled)
                {
                    return;
                }

                SawError = true;

                /* eslint-disable-next-line no-console */
                console.error("Notion sync poll failed", Error);
            }

            if (Date.now() - StartedAt >= CeilingMs)
            {
                SetStatus(SawError ? "Error" : "Empty");

                return;
            }

            Timer = setTimeout(() => void Poll(), PollIntervalMs);
        };

        void Poll();

        return () =>
        {
            Cancelled = true;

            if (Timer !== undefined)
            {
                clearTimeout(Timer);
            }
        };
    }, [ ConnectionId, Attempt ]);

    const Retry = useCallback(() => SetAttempt((Value: number) => Value + 1), [ ]);

    return { Count, Retry, Status };
}
