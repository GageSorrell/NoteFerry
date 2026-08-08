/**
 * Combined welcome + sign-in — the first thing a new user sees. Signing in with
 * Notion is the only action; on success the session appears and the navigator
 * moves on to granting access. Dismissing the browser leaves the user here.
 *
 * @module notivex/app/sign-in
 *
 * @file      sign-in.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Body, Button } from "@notivex/ui/Primitive";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { OnboardingCopy } from "@/features/onboarding/copy";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
import { Semantic } from "@notivex/ui/Token";
import { useColor } from "@notivex/ui";
import { useRouter } from "expo-router";

const Copy = OnboardingCopy.SignIn;

const SignInScreen = () =>
{
    const Router = useRouter();

    /* eslint-disable-next-line jsdoc/require-jsdoc */
    async function HandleSignIn()
    {
        Router.navigate("/sign-in-modal");
    }

    const BackgroundColor = useColor(Semantic.BackgroundMain);

    return (
        <OnboardingScreen
            Hero={ require("../../assets/Onboarding/Welcome.png") }
            Subtitle={ Copy.Body }
            Title={ Copy.Title }>
            <View style={ styles.spacer } />
            <Button
                Appearance="SignIn"
                OnPress={ HandleSignIn }
                Style={ styles.cta }>
                <Image
                    source={ require("../../assets/Onboarding/NotionLogoDark.svg") }
                    style={ { height: 20, width: 20 } }
                />
                <Body Style={ { color: BackgroundColor, fontSize: 14 } }>
                    { Copy.Cta }
                </Body>
            </Button>
            <View style={ { flex: 1.5 } } />
        </OnboardingScreen>
    );
};

const styles = StyleSheet.create({
    cta:
    {
        alignSelf: "center",
        gap: 16,
        justifyContent: "center"
    },
    spacer:
    {
        flex: 1
    }
});

export default SignInScreen;
