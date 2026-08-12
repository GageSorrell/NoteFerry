/**
 * Development-only launcher for deterministic onboarding scenarios.
 *
 * @module notivex/app/onboarding-scenarios
 * @internal
 *
 * @file      onboarding-scenarios.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Body, Button, Description, Heading1 } from "@notivex/ui/Primitive";
import {
    OnboardingMockRegistry,
    OnboardingMockScenarios,
    useDevelopmentOnboarding
} from "@/features/onboarding/onboarding-development";
import { ScrollView, StyleSheet, View } from "react-native";
import type { OnboardingMockScenario } from
    "@/features/onboarding/onboarding-development";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";

const OnboardingScenariosScreen = (): React.JSX.Element | null =>
{
    const Development = useDevelopmentOnboarding();
    const { Pause } = Development;

    useEffect(() => Pause(), [ Pause ]);

    if (!__DEV__)
    {
        return null;
    }

    return (
        <SafeAreaView style={ styles.safeArea }>
            <ScrollView
                contentContainerStyle={ styles.content }
                showsVerticalScrollIndicator={ false }>
                <View style={ styles.header }>
                    <Heading1>Onboarding scenarios</Heading1>
                    <Description>
                        These states use deterministic callbacks and never open OAuth,
                        Notion, or the Notivex API.
                    </Description>
                    { Development.Scenario === null
                        ? null
                        : (
                            <Body>
                                Paused: { OnboardingMockRegistry[Development.Scenario].Label }
                            </Body>
                        ) }
                </View>

                <View style={ styles.section }>
                    <Body>Interactive flow</Body>
                    <Button
                        Appearance="Primary"
                        OnPress={ Development.StartHappyPath }
                        Style={ styles.button }>
                        Run happy path
                    </Button>
                </View>

                <View style={ styles.section }>
                    <Body>Individual states</Body>
                    { OnboardingMockScenarios.map((Scenario: OnboardingMockScenario) => (
                        <Button
                            Appearance="SoftBlue"
                            OnPress={ () => Development.SelectScenario(Scenario) }
                            Style={ styles.button }
                            key={ Scenario }>
                            { OnboardingMockRegistry[Scenario].Label }
                        </Button>
                    )) }
                </View>

                <Button
                    Appearance="Link"
                    OnPress={ Development.ReturnToLive }
                    Style={ styles.button }>
                    Return to live app
                </Button>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    button:
    {
        alignSelf: "stretch",
        minHeight: 48
    },
    content:
    {
        gap: 32,
        paddingBottom: 48,
        paddingHorizontal: 32,
        paddingTop: 24
    },
    header:
    {
        gap: 12
    },
    safeArea:
    {
        flex: 1
    },
    section:
    {
        gap: 12
    }
});

export default OnboardingScenariosScreen;
