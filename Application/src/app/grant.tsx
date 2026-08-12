/**
 * Controller for granting the Notivex content integration access to Notion.
 *
 * @module notivex/app/grant
 *
 * @file      grant.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { OnboardingMockTiming, useDevelopmentOnboarding } from
    "@/features/onboarding/onboarding-development";
import { useEffect, useState } from "react";
import { ConnectNotion } from "@/Domain/Connection";
import { GrantView } from "@/features/onboarding/onboarding-views";
import { UseLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useOnboarding } from "@/features/onboarding/onboarding-context";

const GrantScreen = () =>
{
    const Router = UseLazyRouter();
    const Development = useDevelopmentOnboarding();
    const { Begin } = useOnboarding();
    const [ Pending, SetPending ] = useState(false);

    useEffect(() =>
    {
        if (!Development.Active)
        {
            Begin();
        }
    }, [ Begin, Development.Active ]);

    const IsPending = Development.Active
        ? Development.Scenario === "GrantPending"
        : Pending;

    const HandleGrant = async (): Promise<void> =>
    {
        if (IsPending)
        {
            return;
        }

        if (Development.Active)
        {
            Development.Transition("GrantPending");
            Development.Schedule("Syncing", OnboardingMockTiming.PendingMs);

            if (Development.Automatic)
            {
                Development.Schedule("SyncReady", OnboardingMockTiming.SyncMs);
            }

            return;
        }

        try
        {
            SetPending(true);
            await ConnectNotion();
            Router.replace("/sync")();
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Notion grant failed", Error);
        }
        finally
        {
            SetPending(false);
        }
    };

    return (
        <GrantView
            OnGrant={ () => void HandleGrant() }
            Pending={ IsPending }
        />
    );
};

export default GrantScreen;
