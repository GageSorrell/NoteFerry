/**
 * The "here's what's next" modal shown after tapping "Continue with Notion" on
 * the sign-in screen. It previews the two-step connection flow — sign in to
 * Notion, then pick the databases Notivex can use — and notes that selecting a
 * page brings its nested databases along too. "Got it" launches the same web
 * sign-in the sign-in screen would have.
 *
 * @module notivex/app/sign-in-modal-step-two
 *
 * @file      sign-in-modal-step-two.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { AuthButton, Body, Description, Link, ScreenTitle } from "@notivex/ui/Primitive";
import { ScrollView, StyleSheet, View } from "react-native";
import { HeroImage } from "@/Component";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { SignInWithOAuth } from "@/Domain/Auth/OAuth";
import { UseLazyRouter } from "@/Domain/Utility/LazyRouter";
import { UseTheme } from "@notivex/ui";
import { useState } from "react";

const SignInModalStepTwo = () =>
{
    const [ Busy, SetBusy ] = useState(false);

    const Theme = UseTheme();
    const ModalBackground = Theme.Semantic.BackgroundModal;
    const TipColor = Theme.Semantic.Secondary;

    const HandleSignIn = async () =>
    {
        if (Busy)
        {
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
                    <HeroImage Source={ require("../../assets/Onboarding/SignInModalStepTwo.png") } />
                    <Body>
                        Then, you’ll choose which databases Notivex can see.
                    </Body>
                    <Body Style={ { color: TipColor, textAlign: "center" } }>
                        Tip: Giving Notivex access to a page also gives access to all{" "}
                        databases under that page.
                    </Body>
                    <View style={ styles.spacer } />
                    <AuthButton
                        Icon={
                            <Image
                                source={ require("../../assets/Onboarding/NotionLogoLight.svg") }
                                style={ { height: 24, width: 24 } }
                            />
                        }
                        OnPress={ HandleSignIn }
                        Style={ styles.cta }>
                        Log in
                    </AuthButton>
                    <View style={ { flexDirection: "row", justifyContent: "center" } }>
                        <Description Style={ { fontSize: 14 } }>
                            Not ready yet?{"  "}
                        </Description>
                        <Link
                            OnPress={ Router.navigate("/sign-in") }
                            Style={ { fontSize: 14 } }>
                            Go back
                        </Link>
                    </View>
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
        width: "100%"
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

export default SignInModalStepTwo;
