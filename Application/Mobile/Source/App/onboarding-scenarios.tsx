/**
 * Development-only launcher for deterministic onboarding scenarios.
 *
 * @module noteferry/app/onboarding-scenarios
 * @internal
 *
 * @file      onboarding-scenarios.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Body, Description, Heading1 } from "@noteferry/ui/Primitive/Text";
import { Button } from "@noteferry/ui/Primitive/Button";
import { MakeStyles, Token, ViewStyle } from "@noteferry/ui/Core";
import {
    OnboardingMockRegistry,
    OnboardingMockScenarios,
    useDevelopmentOnboarding
} from "@/features/onboarding/onboarding-development";
import { ScrollView, View } from "react-native";
import type { OnboardingMockScenario } from
    "@/features/onboarding/onboarding-development";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";

const OnboardingScenariosScreen = (): React.JSX.Element | null =>
{
    const Development = useDevelopmentOnboarding();
    const Styles = useStyles();
    const { Pause } = Development;

    useEffect(Pause, [ Pause ]);

    if (!__DEV__)
    {
        return null;
    }

    return (
        <SafeAreaView style={ Styles.SafeArea }>
            <ScrollView
                contentContainerStyle={ Styles.Content }
                showsVerticalScrollIndicator={ false }>
                <View style={ Styles.Header }>
                    <Heading1>Onboarding scenarios</Heading1>
                    <Description>
                        These states use deterministic callbacks and never open OAuth,
                        Notion, or the NoteFerry API.
                    </Description>
                    { Development.Scenario === null
                        ? null
                        : (
                            <Body>
                                Paused: { OnboardingMockRegistry[Development.Scenario].Label }
                            </Body>
                        ) }
                </View>

                <View style={ Styles.Section }>
                    <Body>Interactive flow</Body>
                    <Button
                        Appearance="Primary"
                        OnPress={ Development.StartHappyPath }
                        Style={ Styles.Button }>
                        Run happy path
                    </Button>
                </View>

                <View style={ Styles.Section }>
                    <Body>Individual states</Body>
                    { OnboardingMockScenarios.map((Scenario: OnboardingMockScenario) => (
                        <Button
                            Appearance="SoftBlue"
                            OnPress={ () => Development.SelectScenario(Scenario) }
                            Style={ Styles.Button }
                            key={ Scenario }>
                            { OnboardingMockRegistry[Scenario].Label }
                        </Button>
                    )) }
                </View>

                <Button
                    Appearance="Link"
                    OnPress={ Development.ReturnToLive }
                    Style={ Styles.Button }>
                    Return to live app
                </Button>
            </ScrollView>
        </SafeAreaView>
    );
};

const useStyles = MakeStyles({
    Button: ViewStyle({
        alignSelf: "stretch",
        minHeight: Token.Size.Control.Large
    }),
    Content: ViewStyle({
        gap: Token.Spacing.Xxl,
        paddingBottom: 48,
        paddingHorizontal: Token.Spacing.Xxl,
        paddingTop: Token.Spacing.Xl
    }),
    Header: ViewStyle({
        gap: Token.Spacing.M
    }),
    SafeArea: ViewStyle({
        flex: 1
    }),
    Section: ViewStyle({
        gap: Token.Spacing.M
    })
});

export default OnboardingScenariosScreen;
