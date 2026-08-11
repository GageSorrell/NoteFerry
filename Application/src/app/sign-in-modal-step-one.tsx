/**
 * The "here's what's next" modal shown after tapping "Continue with Notion" on
 * the sign-in screen. It previews the two-step connection flow — sign in to
 * Notion, then pick the databases Notivex can use — and notes that selecting a
 * page brings its nested databases along too. "Got it" launches the same web
 * sign-in the sign-in screen would have.
 *
 * @module notivex/app/sign-in-modal-step-one
 *
 * @file      sign-in-modal-step-one.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Body, Button, ScreenTitle } from "@notivex/ui/Primitive";
import { ScrollView, StyleSheet, View } from "react-native";
import { HeroImage } from "@/Component";
import { SafeAreaView } from "react-native-safe-area-context";
import { UseLazyRouter } from "@/Domain/Utility/LazyRouter";
import { UseTheme } from "@notivex/ui";

const SignInModalStepOne = () =>
{
    const ModalBackground = UseTheme().Semantic.BackgroundModal;

    const Router = UseLazyRouter();

    return (
        <View style={ [ styles.container, { backgroundColor: ModalBackground } ] }>
            <SafeAreaView style={ styles.safeArea }>
                <ScrollView
                    contentContainerStyle={ styles.scroll }
                    showsVerticalScrollIndicator={ false }
                    style={ styles.safeArea }>
                    <View style={ styles.header }>
                        <ScreenTitle>What’s Ahead: Two Steps</ScreenTitle>
                    </View>

                    <HeroImage Source={ require("../../assets/Onboarding/SignInModalStepOne.png") } />

                    <Body>
                        First, you’ll sign into Notion and add the{" "}
                        Notivex integration to your workspace.
                    </Body>
                    <View style={ styles.spacer } />
                    <Button
                        Appearance="Primary"
                        OnPress={ Router.push("/sign-in-modal-step-two") }
                        Style={ styles.cta }>
                        Got it
                    </Button>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    body:
    {
        gap: 12,
        marginTop: 24
    },
    container:
    {
        flex: 1
    },
    cta:
    {
        flex: 1
    },
    ctaRow:
    {
        flexDirection: "row",
        gap: 12,
        maxWidth: "100%"
    },
    header:
    {
        gap: 8
    },
    hero:
    {
        aspectRatio: 1,
        borderRadius: 24,
        borderWidth: 1,
        marginTop: 24,
        width: "100%"
    },
    safeArea:
    {
        flex: 1
    },
    scroll:
    {
        flexGrow: 1,
        gap: 32,
        paddingHorizontal: 32,
        paddingVertical: 24
    },
    spacer:
    {
        flexGrow: 1,
        minHeight: 24
    },
    steps:
    {
        gap: 8
    }
});

export default SignInModalStepOne;
