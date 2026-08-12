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

import {
    OnboardingMockRegistry,
    OnboardingMockTiming,
    useDevelopmentOnboarding
} from "@/features/onboarding/onboarding-development";
import { ConnectNotion } from "@/Domain/Connection";
import { RefreshDataSource } from "@/Domain/Runtime/NotivexApi";
import { SyncView } from "@/features/onboarding/onboarding-views";
import { UseAuth } from "@/Domain/Auth";
import { UseLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useOnboarding } from "@/features/onboarding/onboarding-context";
import { useState } from "react";

const SyncScreen = () =>
{
    const Router = UseLazyRouter();
    const Development = useDevelopmentOnboarding();
    const { SignOut } = UseAuth();
    const {
        Complete,
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
        : LiveStatus;
    const Data = Development.Active ? MockData ?? null : LiveData;
    const IsPending = Development.Active ? MockPending : Pending;

    const HandleAuthorize = async (): Promise<void> =>
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

    const HandleContinue = async (): Promise<void> =>
    {
        if (IsPending || !Data)
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

        for (const Database of Data.Databases)
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

    const HandleRetry = (): void =>
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

    const HandleStartOver = async (): Promise<void> =>
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
            Complete();
        }
        finally
        {
            SetPending(false);
        }
    };

    return (
        <SyncView
            Data={ Data }
            IsPending={ IsPending }
            OnAuthorize={ () => void HandleAuthorize() }
            OnContinue={ () => void HandleContinue() }
            OnRetry={ HandleRetry }
            OnStartOver={ () => void HandleStartOver() }
            ShowLoading={ Development.Active }
            Status={ Status }
        />
    );
};

export default SyncScreen;
