/**
 * @module notivex/app/sign-in
 *
 * @file      sign-in.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { type OAuthProvider, SignInWithOAuth } from "@/features/auth/oauth";
import { Platform, Pressable, StyleSheet } from "react-native";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spacing } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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
        <ThemedView style={ styles.container }>
            <SafeAreaView style={ styles.safeArea }>
                <ThemedText type="title">Notivex</ThemedText>
                <ThemedText
                    style={ styles.subtitle }
                    themeColor="textSecondary"
                    type="default">
                    Sign in to connect your Notion workspace.
                </ThemedText>

                {Platform.OS === "ios"
                    ? (
                        <Pressable
                            /* No-op until Apple sign-in is configured — see
                             * AUTH_SETUP.md §3. */
                            onPress={ () => { } }
                            style={ styles.button }>
                            <ThemedText type="smallBold">Continue with Apple</ThemedText>
                        </Pressable>
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
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    button:
    {
        alignItems: "center",
        alignSelf: "stretch",
        borderColor: "#8883",
        borderRadius: Spacing.L,
        borderWidth: StyleSheet.hairlineWidth,
        justifyContent: "center",
        minHeight: 48,
        paddingHorizontal: Spacing.XL
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
        gap: Spacing.L,
        justifyContent: "center",
        paddingHorizontal: Spacing.XL
    },
    subtitle:
    {
        marginBottom: Spacing.L,
        textAlign: "center"
    }
});

export default SignInScreen;
