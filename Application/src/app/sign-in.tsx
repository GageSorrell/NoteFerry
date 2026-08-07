/**
 * @module notivex/app/sign-in
 *
 * @file      sign-in.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { OAuthProvider, SignInWithOAuth } from "@/features/auth/oauth";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spacing } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useState } from "react";

/* eslint-disable-next-line jsdoc/require-jsdoc */
export default function SignInScreen()
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

                <Pressable
                    /* No-op until Apple sign-in is configured — see
                     * AUTH_SETUP.md §3. Tapping does nothing rather than
                     * throwing "provider not enabled". */
                    onPress={ () => { } }
                    style={ styles.button }>
                    <ThemedText type="smallBold">Continue with Apple</ThemedText>
                </Pressable>

                <Pressable
                    disabled={ Pending !== null }
                    onPress={ () => HandleSignIn("google") }
                    style={ styles.button }>
                    {Pending === "google"
                        ? <ActivityIndicator />
                        : <ThemedText type="smallBold">Continue with Google</ThemedText>}
                </Pressable>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    button:
    {
        alignItems: "center",
        alignSelf: "stretch",
        borderColor: "#8883",
        borderRadius: Spacing.three,
        borderWidth: StyleSheet.hairlineWidth,
        justifyContent: "center",
        minHeight: 48,
        paddingHorizontal: Spacing.four
    },
    container:
    {
        flex: 1
    },
    safeArea:
    {
        alignItems: "center",
        flex: 1,
        gap: Spacing.three,
        justifyContent: "center",
        paddingHorizontal: Spacing.four
    },
    subtitle:
    {
        marginBottom: Spacing.three,
        textAlign: "center"
    }
});
