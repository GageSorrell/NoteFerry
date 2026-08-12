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
import {
    ListConnections,
    RefreshDataSource,
    SearchDataSources
} from "@/Domain/Runtime/NotivexApi";
import { useCallback, useEffect, useState } from "react";
import type { Thunk } from "@sorrell/utility/Function";

/* How often to re-check, and how long to keep waiting before giving up. */
const PollIntervalMs = 3_000 as const;
const CeilingMs = 30_000 as const;

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
    readonly Retry: Thunk;
}

/**
 * Waits for the newly-authorized connection, then polls Notion discovery until
 * at least one data source appears and its schema is cached (`Ready`), the ~30s
 * discovery window elapses with none found (`Empty`), or the window elapses
 * after a request or caching error (`Error`). Connection resolution has no
 * deadline because this hook starts while the user is still reading and
 * completing the grant step. `Retry` starts the wait over.
 *
 * @category Onboarding
 * @since 1.0.0
 */
export function useNotionSync(Enabled: boolean): UseNotionSync
{
    const [ Status, SetStatus ] = useState<NotionSyncStatus>("Syncing");
    const [ Count, SetCount ] = useState(0);
    const [ Attempt, SetAttempt ] = useState(0);

    useEffect(() =>
    {
        if (!Enabled)
        {
            return undefined;
        }

        let Cancelled = false;
        let Timer: ReturnType<typeof setTimeout> | undefined;
        let SawError = false;

        SetStatus("Syncing");
        SetCount(0);

        const Poll = async (
            ConnectionId: Domain.Id.NotionConnectionId,
            StartedAt: number
        ): Promise<void> =>
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
                    const Cached = await Promise.all(Result.map(async (
                        Source: Domain.DataSource.DiscoveredDataSource
                    ) =>
                    {
                        try
                        {
                            await RefreshDataSource(ConnectionId, Source.DataSourceId);

                            return true;
                        }
                        catch (Error)
                        {
                            /* One inaccessible database should not hide other
                             * databases that were shared successfully. */
                            /* eslint-disable-next-line no-console */
                            console.error("Failed to cache an onboarding data source", Error);

                            return false;
                        }
                    }));

                    if (Cancelled)
                    {
                        return;
                    }

                    const CachedCount = Cached.filter(Boolean).length;

                    if (CachedCount > 0)
                    {
                        SetCount(CachedCount);
                        SetStatus("Ready");

                        return;
                    }

                    SawError = true;

                }
                else
                {
                    SawError = false;
                }
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

            Timer = setTimeout(
                () => void Poll(ConnectionId, StartedAt),
                PollIntervalMs
            );
        };

        const ResolveConnection = async (): Promise<void> =>
        {
            try
            {
                const Connections = await ListConnections();

                if (Cancelled)
                {
                    return;
                }

                const ConnectionId = Connections.at(0)?.Id;

                if (ConnectionId !== undefined)
                {
                    await Poll(ConnectionId, Date.now());

                    return;
                }
            }
            catch (Error)
            {
                if (Cancelled)
                {
                    return;
                }

                /* eslint-disable-next-line no-console */
                console.error("Failed to resolve the Notion connection", Error);
            }

            Timer = setTimeout(() => void ResolveConnection(), PollIntervalMs);
        };

        void ResolveConnection();

        return () =>
        {
            Cancelled = true;

            if (Timer !== undefined)
            {
                clearTimeout(Timer);
            }
        };
    }, [ Attempt, Enabled ]);

    const Retry = useCallback(() => SetAttempt((Value: number) => Value + 1), [ ]);

    return { Count, Retry, Status };
}
