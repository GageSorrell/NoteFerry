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
import { useOnboarding } from "@/features/onboarding/onboarding-context";
import { useState } from "react";

const DoneScreen = () =>
{
    const { Complete, RefetchConnection } = useOnboarding();
    const Development = useDevelopmentOnboarding();
    const [ Pending, SetPending ] = useState(false);

    const IsPending = Development.Active
        ? Development.Scenario === "DonePending"
        : Pending;

    const HandleStart = async (): Promise<void> =>
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
        Complete();
    };

    return (
        <DoneView
            OnStart={ () => void HandleStart() }
            IsPending={ IsPending }
        />
    );
};

export default DoneScreen;
