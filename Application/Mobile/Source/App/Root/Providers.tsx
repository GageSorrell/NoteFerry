/**
 * @module notivex/App/Providers
 *
 * @file      Providers.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import {
    DevelopmentOnboardingProvider,
    useDevelopmentOnboarding
} from "@/features/onboarding/onboarding-development";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NotivexAuthProvider } from "@/Domain/Auth/NotivexAuthProvider";
import { ThemeProvider as NotivexThemeProvider } from "@notivex/ui";
import { OnboardingProvider } from "@/features/onboarding/onboarding-context";
import { StatusBar } from "@/Domain/Miscellaneous/StatusBar";

export/**
       * The various providers used across the application.
       *
       * @category Context
       * @since 1.0.0
       */
const Providers = ({ children }: React.PropsWithChildren): React.JSX.Element =>
{
    const Development = useDevelopmentOnboarding();

    return (
        <NotivexThemeProvider>
            <StatusBar />
            <GestureHandlerRootView style={ { flex: 1 } }>
                <BottomSheetModalProvider>
                    <DevelopmentOnboardingProvider>
                        <NotivexAuthProvider>
                            <OnboardingProvider Enabled={ !Development.Active }>
                                { children }
                            </OnboardingProvider>
                        </NotivexAuthProvider>
                    </DevelopmentOnboardingProvider>
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
        </NotivexThemeProvider>
    );
};
