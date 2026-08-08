/**
 * The "here's what's next" modal shown after tapping "Continue with Notion" on
 * the sign-in screen. It previews the two-step connection flow — sign in to
 * Notion, then pick the databases Notivex can use — and notes that selecting a
 * page brings its nested databases along too. "Got it" launches the same web
 * sign-in the sign-in screen would have.
 *
 * @module notivex/app/sign-in-modal
 *
 * @file      sign-in-modal.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Body, Button, Description, Heading1 } from "@notivex/ui/Primitive";
import { ScrollView, StyleSheet, View } from "react-native";
import { OnboardingCopy } from "@/features/onboarding/copy";
import { SafeAreaView } from "react-native-safe-area-context";
import { Semantic } from "@notivex/ui/Token";
import { SignInWithOAuth } from "@/Domain/Auth/OAuth";
import { useColor } from "@notivex/ui";
import { useState } from "react";

const Copy = OnboardingCopy.SignInModal;

const SignInModal = () =>
{
    const [ Busy, SetBusy ] = useState(false);

    const ModalBackground = useColor(Semantic.BackgroundModal);
    const PlaceholderBackground = useColor(Semantic.BackgroundSidebar);
    const PlaceholderBorder = useColor(Semantic.Border);

    /* eslint-disable-next-line jsdoc/require-jsdoc */
    async function HandleSignIn()
    {
        if (Busy)
        {
            return;
        }

        try
        {
            SetBusy(true);
            await SignInWithOAuth("notion");
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
    }

    return (
        <View style={ [ styles.container, { backgroundColor: ModalBackground } ] }>
            <SafeAreaView style={ styles.safeArea }>
                {/* Scrolls so the full-width square hero never pushes the copy or
                    the CTA off-screen on short or near-square displays. When the
                    content fits, the flexible spacer pins the button to the
                    bottom; when it doesn't, everything scrolls. */}
                <ScrollView
                    contentContainerStyle={ styles.scroll }
                    showsVerticalScrollIndicator={ false }
                    style={ styles.safeArea }>
                    <View style={ styles.header }>
                        <Heading1>{ Copy.Title }</Heading1>
                    </View>

                    {/* Reserved space for a full-width, square hero graphic. Swap
                        this placeholder for an <Image> once the artwork exists. */}
                    <View
                        style={ [
                            styles.hero,
                            { backgroundColor: PlaceholderBackground, borderColor: PlaceholderBorder }
                        ] }
                    />

                    <View style={ styles.body }>
                        <View style={ styles.steps }>
                            { Copy.Steps.map((Step: string, Index: number) => (
                                <Body key={ Step }>
                                    { `${ Index + 1 }.  ${ Step }` }
                                </Body>
                            )) }
                        </View>
                        <Description>{ Copy.Note }</Description>
                    </View>
                    <View style={ styles.spacer } />
                    <Button
                        Appearance="Primary"
                        Loading={ Busy }
                        OnPress={ HandleSignIn }
                        Style={ styles.cta }>
                        { Copy.Cta }
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
        width: "100%"
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

export default SignInModal;
