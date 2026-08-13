/**
 * Controller for the post-authorization Notion discovery outcomes.
 *
 * @module notivex/app/sync
 *
 * @file      sync.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import {
    OnboardingMockRegistry,
    OnboardingMockTiming,
    useDevelopmentOnboarding
} from "@/features/onboarding/onboarding-development";
import { ConnectNotion } from "@/Domain/Connection";
import { RefreshDataSource } from "@/Domain/Runtime/NotivexApi";
import { SyncView } from "@/features/onboarding/onboarding-views";
import { useAuth } from "@/Domain/Auth";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useOnboarding } from "@/features/onboarding/onboarding-context";
import { useState } from "react";

const SyncScreen = () =>
{
    const Router = useLazyRouter();
    const Development = useDevelopmentOnboarding();
    const { SignOut } = useAuth();
    const {
        AuthorizationSucceeded,
        Complete,
        IsAuthorizing,
        NotionSync: { Data: LiveData, Retry, Status: LiveStatus },
        RecordAuthorizationResult
    } = useOnboarding();
    const [ Pending, SetPending ] = useState(false);

    const MockDefinition = Development.Scenario === null
        ? null
        : OnboardingMockRegistry[Development.Scenario];
    const MockStatus = MockDefinition !== null && "SyncStatus" in MockDefinition
        ? MockDefinition.SyncStatus
        : undefined;
    const MockData = MockDefinition !== null && "SyncData" in MockDefinition
        ? MockDefinition.SyncData
        : undefined;
    const MockPending = MockDefinition !== null && "IsPending" in MockDefinition
        ? MockDefinition.IsPending === true
        : false;
    const Status = Development.Active && MockStatus !== undefined
        ? MockStatus
        : AuthorizationSucceeded === null && !IsAuthorizing
            ? "NoIntegration"
            : LiveStatus;
    const Data = Development.Active ? MockData ?? null : LiveData;
    const IsPending = Development.Active ? MockPending : Pending;

    /* The content-authorization browser is still open. Mounting SyncView now
     * would start its one-second loading delay before the user returns. */
    if (!Development.Active && IsAuthorizing && AuthorizationSucceeded === null)
    {
        return null;
    }

    const OnAuthorize = async (): Promise<void> =>
    {
        if (IsPending)
        {
            return;
        }

        if (Development.Active)
        {
            Development.Transition(Status === "PagesOnly"
                ? "PagesOnlyPending"
                : "NoAccessPending");
            Development.Schedule("Syncing", OnboardingMockTiming.PendingMs);
            Development.Schedule(
                "Ready",
                OnboardingMockTiming.PendingMs + OnboardingMockTiming.SyncMs
            );

            return;
        }

        try
        {
            SetPending(true);
            const Succeeded = await ConnectNotion();

            if (Succeeded)
            {
                RecordAuthorizationResult(true);
                Retry();
            }
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Notion reauthorization failed", Error);
        }
        finally
        {
            SetPending(false);
        }
    };

    const OnContinue = async (
        Databases: ReadonlyArray<Domain.DataSource.OnboardingDatabase>
    ): Promise<void> =>
    {
        if (IsPending || !Data || Databases.length === 0)
        {
            return;
        }

        if (Development.Active)
        {
            Development.Transition("ReadyPending");
            Development.Schedule("Done", OnboardingMockTiming.PendingMs);

            return;
        }

        SetPending(true);
        let CachedCount = 0;

        for (const Database of Databases)
        {
            try
            {
                await RefreshDataSource(Database.ConnectionId, Database.DataSourceId);
                CachedCount += 1;
            }
            catch (Error)
            {
                /* One inaccessible database should not prevent the other
                 * selected databases from being cached. */
                /* eslint-disable-next-line no-console */
                console.error("Failed to cache an onboarding database", Error);
            }
        }

        SetPending(false);

        if (CachedCount > 0)
        {
            Router.replace("/done")();
        }
    };

    const OnRetry = (): void =>
    {
        if (IsPending)
        {
            return;
        }

        if (Development.Active)
        {
            Development.Transition("Syncing");
            Development.Schedule("Ready", OnboardingMockTiming.SyncMs);

            return;
        }

        Retry();
    };

    const OnStartOver = async (): Promise<void> =>
    {
        if (IsPending)
        {
            return;
        }

        if (Development.Active)
        {
            Development.Transition("NoIntegrationPending");
            Development.Schedule("SignIn", OnboardingMockTiming.PendingMs);

            return;
        }

        try
        {
            SetPending(true);
            await SignOut();
            await Complete();
        }
        finally
        {
            SetPending(false);
        }
    };

    return (
        <SyncView
            { ...{
                Data,
                IsPending,
                OnAuthorize,
                OnContinue,
                OnRetry,
                OnStartOver,
                Status
            } }
            ShowLoading={ Development.Active }
        />
    );
};

export default SyncScreen;
