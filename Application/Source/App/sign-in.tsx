/**
 * Combined welcome + sign-in controller. The visual state is kept in the pure
 * {@link SignInView}; this route supplies real navigation or a development
 * scenario transition.
 *
 * @module notivex/app/sign-in
 *
 * @file      sign-in.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { SignInView } from "@/features/onboarding/onboarding-views";
import { UseLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useDevelopmentOnboarding } from "@/features/onboarding/onboarding-development";

const SignInScreen = () =>
{
    const Router = UseLazyRouter();
    const Development = useDevelopmentOnboarding();

    const OnContinue = Development.Active
        ? () => Development.Transition("SignInModalStepOne")
        : Router.push("/sign-in-modal-step-one");

    return <SignInView { ...{ OnContinue } } />;
};

export default SignInScreen;
