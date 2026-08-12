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

import { OnboardingMockTiming, useDevelopmentOnboarding } from
    "@/features/onboarding/onboarding-development";
import { SignInModalStepTwoView } from "@/features/onboarding/onboarding-views";
import { SignInWithOAuth } from "@/Domain/Auth/OAuth";
import { UseLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useState } from "react";

const SignInModalStepTwo = () =>
{
    const [ Busy, SetBusy ] = useState(false);
    const Router = UseLazyRouter();
    const Development = useDevelopmentOnboarding();

    const Pending = Development.Active
        ? Development.Scenario === "SignInPending"
        : Busy;

    const HandleSignIn = async (): Promise<void> =>
    {
        if (Pending)
        {
            return;
        }

        if (Development.Active)
        {
            Development.Transition("SignInPending");
            Development.Schedule("Grant", OnboardingMockTiming.PendingMs);

            return;
        }

        try
        {
            SetBusy(true);
            await SignInWithOAuth();
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Notion sign-in failed", Error);
        }
        finally
        {
            SetBusy(false);
        }
    };

    const HandleBack = Development.Active
        ? () => Development.Transition("SignIn")
        : Router.navigate("/sign-in");

    return (
        <SignInModalStepTwoView
            OnBack={ HandleBack }
            OnSignIn={ () => void HandleSignIn() }
            Pending={ Pending }
        />
    );
};

export default SignInModalStepTwo;
