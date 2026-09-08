/**
 * Combined welcome + sign-in controller. The visual state is kept in the pure
 * {@link SignInView}; this route supplies real navigation or a development
 * scenario transition.
 *
 * @module noteferry/app/sign-in
 *
 * @file      sign-in.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Asset } from "expo-asset";
import { Image } from "expo-image";
import { SignInView } from "@/features/onboarding/onboarding-views";
import { useDevelopmentOnboarding } from "@/features/onboarding/onboarding-development";
import { useEffect } from "react";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";

/* The require target is a static string literal, as Metro's bundler needs. */
const NotionLogoModule = require("../../Resource/Onboarding/NotionLogoLight.svg");

const SignInScreen = () =>
{
    const Router = useLazyRouter();
    const Development = useDevelopmentOnboarding();

    const OnContinue = Development.Active
        ? () => Development.Transition("SignInModal")
        : Router.push("/sign-in-modal");

    /* The sign-in modal's "Continue with Notion" button is the first place
     * this icon ever renders, so without warming `expo-image`'s cache here —
     * while the user is still looking at this screen — it flashes in a beat
     * after the bottom sheet opens instead of being present immediately. */
    useEffect(() =>
    {
        void Asset.fromModule(NotionLogoModule)
            .downloadAsync()
            .then((LogoAsset: Asset) => Image.prefetch(LogoAsset.localUri ?? LogoAsset.uri))
            .catch(() => undefined);
    }, []);

    return <SignInView { ...{ OnContinue } } />;
};

export default SignInScreen;
