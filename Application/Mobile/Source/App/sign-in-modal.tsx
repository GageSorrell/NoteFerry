/**
 * Controller for the sign-in explanation bottom sheet and Notion sign-in.
 * The route itself renders as a transparent overlay (see `_layout.tsx`) so
 * the welcome screen (`/sign-in`) stays visible and dimmed beneath it.
 *
 * @module noteferry/app/sign-in-modal
 *
 * @file      sign-in-modal.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { EventArg, NavigationAction } from "expo-router/build/react-navigation";
import { OnboardingMockTiming, useDevelopmentOnboarding } from "@/features/onboarding/onboarding-development";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdoptNotionAuthorization } from "@/Domain/Runtime/NoteFerryApi";
import { BottomSheet, type BottomSheet as BottomSheetHandle } from "@noteferry/ui/Primitive/BottomSheet";
import { SignInModalView } from "@/features/onboarding/onboarding-views";
import { SignInWithOAuth } from "@/Domain/Auth/OAuth";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useNavigation } from "expo-router";
import { useOnboarding } from "@/features/onboarding/onboarding-context";

const SignInModal = () =>
{
    const [ Busy, SetBusy ] = useState(false);
    const Router = useLazyRouter();
    const Navigation = useNavigation();
    const Development = useDevelopmentOnboarding();
    const { Begin, Complete, RecordAuthorizationResult } = useOnboarding();
    const Sheet = useRef<BottomSheetHandle>(null);

    /* The sheet's own close animation (swipe, backdrop tap, or a
     * programmatic `.dismiss()` below) is the only way this screen should
     * ever disappear. This flag tells the `beforeRemove` listener that a
     * removal it is seeing already went through that animation via
     * `OnSheetDismiss`, so it should let it through rather than
     * re-triggering it. */
    const AllowNavigation = useRef(false);

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
         * tree. The Notion authorization used for sign-in is also adopted as
         * the user's first content connection after the callback returns. */
        await Begin();
        let IsSignedIn = false;

        try
        {
            SetBusy(true);
            const Result = await SignInWithOAuth();

            if (Result === null)
            {
                await Complete();

                return;
            }

            IsSignedIn = true;
            await AdoptNotionAuthorization(
                Result.ProviderToken,
                Result.ProviderRefreshToken
            );
            RecordAuthorizationResult(true);
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

    /* Presents the sheet once this (otherwise-invisible) route has mounted,
     * so it slides up and dims `/sign-in` behind it rather than appearing
     * instantly. */
    useEffect(() =>
    {
        Sheet.current?.present();
    }, []);

    /* Fires once the sheet has finished closing, however that was
     * triggered — swipe-to-dismiss, a backdrop tap, or the programmatic
     * `.dismiss()` below — and performs the actual navigation back to the
     * welcome screen. */
    const OnSheetDismiss = useCallback((): void =>
    {
        AllowNavigation.current = true;

        if (Development.Active)
        {
            Development.Transition("SignIn");

            return;
        }

        Router.navigate("/sign-in")();
    }, [ Development, Router ]);

    type BeforeRemoveEvent = EventArg<"beforeRemove", true, { action: NavigationAction; }>;

    /* Catches every way this screen can be left that does not already go
     * through the sheet's own close animation — chiefly the Android
     * hardware back button — and routes it through that animation instead
     * of letting the screen disappear abruptly. */
    useEffect(() => Navigation.addListener("beforeRemove", (Event: BeforeRemoveEvent) =>
    {
        if (AllowNavigation.current)
        {
            return;
        }

        Event.preventDefault();
        Sheet.current?.dismiss();
    }), [ Navigation ]);

    return (
        <BottomSheet
            EnableDynamicSizing
            OnDismiss={ OnSheetDismiss }
            Ref={ Sheet }>
            <SignInModalView { ...{ IsPending, OnSignIn } } />
        </BottomSheet>
    );
};

export default SignInModal;
