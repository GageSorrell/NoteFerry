/**
 * Controller for choosing the offline-submit notification preference during
 * onboarding.
 *
 * @module notivex/app/enable-notifications
 *
 * @file      enable-notifications.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { EnableNotificationsView } from
    "@/features/onboarding/onboarding-views";
import {
    OnboardingMockTiming,
    useDevelopmentOnboarding
} from "@/features/onboarding/onboarding-development";
import { UpdateProfileSettings } from "@/Domain/Runtime/NotivexApi";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useState } from "react";

const EnableNotificationsScreen = (): React.JSX.Element =>
{
    const Development = useDevelopmentOnboarding();
    const Router = useLazyRouter();
    const [ Pending, SetPending ] = useState(false);
    const IsPending = Development.Active
        ? Development.Scenario === "NotificationsPending"
        : Pending;

    const OnChoose = async (Enabled: boolean): Promise<void> =>
    {
        if (IsPending)
        {
            return;
        }

        if (Development.Active)
        {
            Development.Transition("NotificationsPending");
            Development.Schedule("Done", OnboardingMockTiming.PendingMs);

            return;
        }

        try
        {
            SetPending(true);
            await UpdateProfileSettings({ NotifyOnOfflineSubmit: Enabled });
            Router.replace("/done")();
        }
        catch (Error)
        {
            console.error("Failed to save the onboarding notification preference", Error);
        }
        finally
        {
            SetPending(false);
        }
    };

    return (
        <EnableNotificationsView
            { ...{ IsPending } }
            OnEnable={ () => void OnChoose(true) }
            OnSkip={ () => void OnChoose(false) }
        />
    );
};

export default EnableNotificationsScreen;
