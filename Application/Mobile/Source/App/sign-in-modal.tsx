/**
 * Controller for the sign-in explanation modal and Notion sign-in.
 *
 * @module notivex/app/sign-in-modal
 *
 * @file      sign-in-modal.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type { EventArg, NavigationAction } from "expo-router/build/react-navigation";
import { MakeStyles, ViewStyle, useTheme } from "@notivex/ui";
import { OnboardingMockTiming, useDevelopmentOnboarding } from "@/features/onboarding/onboarding-development";
import { Stack, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react-native";
import { ConnectNotion } from "@/Domain/Connection";
import { Pressable } from "@notivex/ui/Primitive";
import type { PressableStateCallbackType } from "react-native";
import { SignInModalView } from "@/features/onboarding/onboarding-views";
import { SignInWithOAuth } from "@/Domain/Auth/OAuth";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useOnboarding } from "@/features/onboarding/onboarding-context";

interface HeaderBackButtonProps
{
    readonly OnPress: () => void;
}

/** Native-stack header back control that always routes to the welcome screen. */
const HeaderBackButton = ({ OnPress }: HeaderBackButtonProps): React.JSX.Element =>
{
    const Theme = useTheme();
    const Styles = useHeaderStyles();

    return (
        <Pressable
            Accessibility={ { Label: "Back to welcome", Role: "button" } }
            OnPress={ OnPress }
            hitSlop={ 8 }
            style={ ({ pressed }: PressableStateCallbackType) => [
                Styles.BackButton,
                pressed && Styles.BackButtonPressed
            ] }>
            <ChevronLeft
                color={ Theme.Semantic.IconPrimary }
                size={ 26 }
                strokeWidth={ 2 }
            />
        </Pressable>
    );
};

const SignInModal = () =>
{
    const [ Busy, SetBusy ] = useState(false);
    const Router = useLazyRouter();
    const Navigation = useNavigation();
    const Development = useDevelopmentOnboarding();
    const { Begin, Complete, RecordAuthorizationResult } = useOnboarding();

    /* Both the native header button and the footer link call `OnBack`
     * directly, but a hardware back press or an iOS swipe-dismiss instead
     * fire `beforeRemove`, which the listener below intercepts. This flag
     * tells that listener the removal it is seeing was already initiated by
     * `OnBack`, so it should let it through rather than re-triggering it. */
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

    const OnBack = useCallback((): void =>
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
     * through `OnBack` — the Android hardware back button and the iOS
     * swipe-to-dismiss gesture — and redirects them to the welcome screen
     * the same way the header button and footer link do. */
    useEffect(() => Navigation.addListener("beforeRemove", (Event: BeforeRemoveEvent) =>
    {
        if (AllowNavigation.current)
        {
            return;
        }

        Event.preventDefault();
        OnBack();
    }), [ Navigation, OnBack ]);

    return (
        <>
            <Stack.Screen
                options={ { headerLeft: () => <HeaderBackButton OnPress={ OnBack } /> } }
            />
            <SignInModalView { ...{ IsPending, OnSignIn } } />
        </>
    );
};

export default SignInModal;

const useHeaderStyles = MakeStyles({
    BackButton: ViewStyle({
        alignItems: "center",
        height: 32,
        justifyContent: "center",
        marginLeft: -8,
        width: 32
    }),
    BackButtonPressed: ViewStyle({
        opacity: 0.5
    })
});
