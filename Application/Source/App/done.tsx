/**
 * Controller for completing onboarding and entering the app.
 *
 * @module notivex/app/done
 *
 * @file      done.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { OnboardingMockTiming, useDevelopmentOnboarding } from
    "@/features/onboarding/onboarding-development";
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

    return (
        <DoneView
            { ...{ IsPending, OnStart } }
            OnCustomize={ Router.push("/database-settings") }
        />
    );
};

export default DoneScreen;
