/**
 * Controller for the first sign-in explanation modal.
 *
 * @module notivex/app/sign-in-modal-step-one
 *
 * @file      sign-in-modal-step-one.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { SignInModalStepOneView } from "@/features/onboarding/onboarding-views";
import { UseLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useDevelopmentOnboarding } from "@/features/onboarding/onboarding-development";

const SignInModalStepOne = () =>
{
    const Router = UseLazyRouter();
    const Development = useDevelopmentOnboarding();

    const OnContinue = Development.Active
        ? () => Development.Transition("SignInModalStepTwo")
        : Router.push("/sign-in-modal-step-two");

    return <SignInModalStepOneView { ...{ OnContinue } } />;
};

export default SignInModalStepOne;
