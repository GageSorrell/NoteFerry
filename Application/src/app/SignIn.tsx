/**
 * @module notivex/app/SignIn
 *
 * @file      SignIn.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Body, Button, Heading1 } from "@notivex/ui/Primitive";
import { type OAuthProvider, SignInWithOAuth } from "@/Domain/Auth/OAuth";
import { Platform, StyleSheet, View } from "react-native";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

const SignInScreen = () =>
{
    const [ Pending, SetPending ] = useState<OAuthProvider | null>(null);

    /* eslint-disable-next-line jsdoc/require-jsdoc */
    async function HandleSignIn(Provider: OAuthProvider)
    {
        try
        {
            SetPending(Provider);
            await SignInWithOAuth(Provider);
        }
        catch (Error)
        {
            /* Routing on the resulting session/error is a later slice; surface
             * it in the log for now. */
            /* eslint-disable-next-line no-console */
            console.error("OAuth sign-in failed", Error);
        }
        finally
        {
            SetPending(null);
        }
    }

    return (
        <View style={ styles.container }>
            <SafeAreaView style={ styles.safeArea }>
                <Heading1>
                    Notivex
                </Heading1>
                <Body Style={ styles.subtitle }>
                    Sign in to connect your Notion workspace.
                </Body>

                { Platform.OS === "ios"
                    ? (
                        <Button Style={ styles.button }>
                            Continue with Apple
                        </Button>
                    )
                    : (
                        <GoogleSigninButton
                            color={ GoogleSigninButton.Color.Dark }
                            disabled={ Pending !== null }
                            onPress={ () => HandleSignIn("google") }
                            size={ GoogleSigninButton.Size.Wide }
                            style={ styles.googleButton }
                        />
                    )}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    button:
    {
        minHeight: 48,
        paddingHorizontal: 64
    },
    container:
    {
        flex: 1
    },
    googleButton:
    {
        height: 48,
        width: 240
    },
    safeArea:
    {
        alignItems: "center",
        flex: 1,
        gap: 48,
        justifyContent: "center",
        paddingHorizontal: 64
    },
    subtitle:
    {
        marginBottom: 32,
        textAlign: "center"
    },
    title:
    {
        fontSize: 48,
        fontWeight: 600,
        lineHeight: 52
    }
});

export default SignInScreen;
