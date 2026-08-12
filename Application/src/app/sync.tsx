/**
 * Controller for the post-grant Notion synchronization states.
 *
 * @module notivex/app/sync
 *
 * @file      sync.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { OnboardingMockRegistry, OnboardingMockTiming, useDevelopmentOnboarding } from
    "@/features/onboarding/onboarding-development";
import { SyncView } from "@/features/onboarding/onboarding-views";
import { UseLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useOnboarding } from "@/features/onboarding/onboarding-context";

const SyncScreen = () =>
{
    const Router = UseLazyRouter();
    const Development = useDevelopmentOnboarding();
    const { NotionSync: { Retry, Status: LiveStatus } } = useOnboarding();

    const MockDefinition = Development.Scenario === null
        ? null
        : OnboardingMockRegistry[Development.Scenario];
    const MockStatus = MockDefinition !== null && "SyncStatus" in MockDefinition
        ? MockDefinition.SyncStatus
        : undefined;
    const Status = Development.Active && MockStatus !== undefined
        ? MockStatus
        : LiveStatus;

    const HandleContinue = Development.Active
        ? () => Development.Transition("Done")
        : Router.replace("/done");

    const HandleRetry = (): void =>
    {
        if (Development.Active)
        {
            Development.Transition("Syncing");
            Development.Schedule("SyncReady", OnboardingMockTiming.SyncMs);

            return;
        }

        Retry();
    };

    return (
        <SyncView
            OnContinue={ HandleContinue }
            OnRetry={ HandleRetry }
            Status={ Status }
        />
    );
};

export default SyncScreen;
