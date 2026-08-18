/**
 * Controller for the second sign-in explanation modal and Notion sign-in.
 *
 * @module notivex/app/sign-in-modal-step-two
 *
 * @file      sign-in-modal-step-two.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { OnboardingMockTiming, useDevelopmentOnboarding } from "@/features/onboarding/onboarding-development";
import { ConnectNotion } from "@/Domain/Connection";
import { SignInModalStepTwoView } from "@/features/onboarding/onboarding-views";
import { SignInWithOAuth } from "@/Domain/Auth/OAuth";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useOnboarding } from "@/features/onboarding/onboarding-context";
import { useState } from "react";

const SignInModalStepTwo = () =>
{
    const [ Busy, SetBusy ] = useState(false);
    const Router = useLazyRouter();
    const Development = useDevelopmentOnboarding();
    const { Begin, Complete, RecordAuthorizationResult } = useOnboarding();

    const IsPending = Development.Active
        ? Development.Scenario === "SignInPending"
        : Busy;

    const OnSignIn = async (): Promise<void> =>
    {
        if (IsPending)
        {
            return;
        }

        if (Development.Active)
        {
            Development.Transition("SignInPending");
            Development.Schedule("Syncing", OnboardingMockTiming.PendingMs);
            Development.Schedule(
                "Ready",
                OnboardingMockTiming.PendingMs + OnboardingMockTiming.SyncMs
            );

            return;
        }

        /* Enter onboarding before authentication changes the protected route
         * tree. The content authorization starts immediately after sign-in, so
         * there is no intermediate grant screen. */
        await Begin();
        let IsSignedIn = false;

        try
        {
            SetBusy(true);
            const Session = await SignInWithOAuth();

            if (Session === null)
            {
                await Complete();

                return;
            }

            IsSignedIn = true;
            RecordAuthorizationResult(await ConnectNotion());
        }
        catch (Error)
        {
            if (IsSignedIn)
            {
                RecordAuthorizationResult(false);
            }
            else
            {
                await Complete();
            }

            /* eslint-disable-next-line no-console */
            console.error("Notion sign-in or authorization failed", Error);
        }
        finally
        {
            SetBusy(false);
        }
    };

    const OnBack = Development.Active
        ? () => Development.Transition("SignIn")
        : Router.navigate("/sign-in");

    return <SignInModalStepTwoView { ...{ IsPending, OnBack, OnSignIn } } />;
};

export default SignInModalStepTwo;
