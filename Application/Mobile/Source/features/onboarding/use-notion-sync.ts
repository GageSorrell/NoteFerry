/**
 * Resolves the post-authorization Notion resources used by onboarding. Notion
 * search is eventually consistent immediately after OAuth, so negative results
 * are polled for up to 30 seconds while a positive database result can render
 * immediately.
 *
 * @module notivex/features/onboarding/use-notion-sync
 *
 * @file      use-notion-sync.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { DiscoverOnboarding, ListConnections } from "@/Domain/Runtime/NotivexApi";
import { useCallback, useEffect, useState } from "react";
import type { Thunk } from "@sorrell/effect/Function";

const PollIntervalMs = 3_000 as const;
const CeilingMs = 30_000 as const;

/** Every user-visible outcome after the content-authorization browser closes. */
export type NotionSyncStatus =
    | "Syncing"
    | "NoIntegration"
    | "NoAccess"
    | "PagesOnly"
    | "Ready"
    | "Error";

/** The state and controls exposed to the post-authorization route. */
export interface UseNotionSync
{
    readonly Count: number;
    readonly Data: Domain.DataSource.OnboardingDiscovery | null;
    readonly Retry: Thunk;
    readonly Status: NotionSyncStatus;
}

const EmptyDiscovery: Domain.DataSource.OnboardingDiscovery =
    {
        DatabaseCount: 0,
        Databases: [ ],
        PageCount: 0,
        Pages: [ ]
    };

/**
 * Waits for the OAuth callback's connection row, then polls live Notion search
 * until a database is found or the eventual-consistency window expires.
 * `AuthorizationSucceeded === false` classifies a cancelled/denied install
 * immediately; `null` keeps discovery dormant while the browser is still open.
 */
export function useNotionSync(
    Enabled: boolean,
    AuthorizationSucceeded: boolean | null
): UseNotionSync
{
    const [ Status, SetStatus ] = useState<NotionSyncStatus>("Syncing");
    const [ Data, SetData ] = useState<Domain.DataSource.OnboardingDiscovery | null>(null);
    const [ Attempt, SetAttempt ] = useState(0);

    useEffect(() =>
    {
        if (!Enabled || AuthorizationSucceeded !== true)
        {
            return undefined;
        }

        let Cancelled = false;
        let Timer: ReturnType<typeof setTimeout> | undefined;
        let Latest: Domain.DataSource.OnboardingDiscovery = EmptyDiscovery;
        let SawError = false;
        const StartedAt = Date.now();

        queueMicrotask(() =>
        {
            if (!Cancelled)
            {
                SetStatus("Syncing");
                SetData(null);
            }
        });

        const FinishNegativeResult = (): void =>
        {
            SetData(Latest);
            SetStatus(SawError && Latest.PageCount === 0
                ? "Error"
                : Latest.PageCount > 0
                    ? "PagesOnly"
                    : "NoAccess");
        };

        const PollDiscovery = async (
            ConnectionId: Domain.Id.NotionConnectionId
        ): Promise<void> =>
        {
            try
            {
                Latest = await DiscoverOnboarding(ConnectionId);
                SawError = false;

                if (Cancelled)
                {
                    return;
                }

                if (Latest.DatabaseCount > 0)
                {
                    SetData(Latest);
                    SetStatus("Ready");

                    return;
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
                console.error("Notion onboarding discovery failed", Error);
            }

            if (Date.now() - StartedAt >= CeilingMs)
            {
                FinishNegativeResult();

                return;
            }

            Timer = setTimeout(
                () => void PollDiscovery(ConnectionId),
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

                const Connection: Domain.NotionConnection.NotionConnection | undefined =
                    Connections.find((Item: Domain.NotionConnection.NotionConnection) =>
                        Item.Status === "Active");

                if (Connection)
                {
                    await PollDiscovery(Connection.Id);

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

            if (Date.now() - StartedAt >= CeilingMs)
            {
                SetData(EmptyDiscovery);
                SetStatus("NoIntegration");

                return;
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
    }, [ Attempt, AuthorizationSucceeded, Enabled ]);

    const Retry = useCallback(() =>
    {
        SetStatus("Syncing");
        SetData(null);
        SetAttempt((Value: number) => Value + 1);
    }, [ ]);

    const EffectiveStatus = !Enabled || AuthorizationSucceeded === null
        ? "Syncing"
        : AuthorizationSucceeded
            ? Status
            : "NoIntegration";
    const EffectiveData = !Enabled || AuthorizationSucceeded === null
        ? null
        : AuthorizationSucceeded
            ? Data
            : EmptyDiscovery;

    return {
        Count: EffectiveData?.DatabaseCount ?? 0,
        Data: EffectiveData,
        Retry,
        Status: EffectiveStatus
    };
}
