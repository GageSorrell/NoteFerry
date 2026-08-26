/**
 * Controller for completing onboarding and entering the app.
 *
 * @module noteferry/app/done
 *
 * @file      done.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { AddWorkspace } from "@/Domain/Connection";
import { ListConnections } from "@/Domain/Runtime/NoteFerryApi";
import { OnboardingMockTiming, useDevelopmentOnboarding } from "@/features/onboarding/onboarding-development";
import { DoneView } from "@/features/onboarding/onboarding-views";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useOnboarding } from "@/features/onboarding/onboarding-context";
import { useState } from "react";

const DoneScreen = () =>
{
    const Router = useLazyRouter();
    const { Complete, RefetchConnection } = useOnboarding();
    const Development = useDevelopmentOnboarding();
    const [ Pending, SetPending ] = useState(false);
    const [ IsAddingWorkspace, SetIsAddingWorkspace ] = useState(false);

    const IsPending = Development.Active
        ? Development.Scenario === "DonePending"
        : Pending;

    const OnStart = async (): Promise<void> =>
    {
        if (IsPending)
        {
            return;
        }

        if (Development.Active)
        {
            Development.Transition("DonePending");
            Development.ScheduleReturnToPicker(OnboardingMockTiming.PendingMs);

            return;
        }

        SetPending(true);
        await RefetchConnection();
        await Complete();
    };

    const OnAddWorkspace = async (): Promise<void> =>
    {
        if (IsPending || IsAddingWorkspace)
        {
            return;
        }

        if (Development.Active)
        {
            return;
        }

        SetIsAddingWorkspace(true);

        try
        {
            const Existing = await ListConnections();
            const NewConnection = await AddWorkspace(Existing);

            if (NewConnection !== null)
            {
                Router.push({
                    params: {
                        connectionId: NewConnection.Id,
                        workspaceName: NewConnection.WorkspaceName
                    },
                    pathname: "/data-sources"
                })();
            }
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Failed to add workspace", Error);
        }
        finally
        {
            SetIsAddingWorkspace(false);
        }
    };

    return (
        <DoneView
            { ...{ IsAddingWorkspace, IsPending, OnAddWorkspace, OnStart } }
            OnCustomize={ Router.push("/database-settings") }
        />
    );
};

export default DoneScreen;
