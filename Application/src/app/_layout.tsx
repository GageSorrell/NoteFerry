/**
 * @module notivex/app/_layout
 *
 * @file      _layout.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

// import * as SplashScreen from "expo-splash-screen";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider as NotivexThemeProvider } from "@notivex/ui";
import { useColorScheme } from "react-native";
// SplashScreen.preventAutoHideAsync();

/**
 * The navigator, split out so it can read the auth context provided above it.
 * `Stack.Protected` swaps the reachable routes based on whether a Supabase
 * session exists — signed-out users can only see `sign-in`, signed-in users
 * only see the app (ArchitectureInitialDraft.md §5, §6).
 */
/* eslint-disable-next-line jsdoc/require-jsdoc */
function RootNavigator()
{
    const { Session, IsLoading } = useAuth();

    if (IsLoading)
    {
        /* Session is still being restored from secure storage; render nothing
         * to avoid flashing the sign-in screen at a signed-in user. */
        return null;
    }

    const IsAuthenticated = Session !== null;

    return (
        <Stack screenOptions={ { headerShown: false } }>
            <Stack.Protected guard={ IsAuthenticated }>
                <Stack.Screen name="index" />
            </Stack.Protected>
            <Stack.Protected guard={ !IsAuthenticated }>
                <Stack.Screen name="sign-in" />
            </Stack.Protected>
            <Stack.Protected guard={ __DEV__ }>
                <Stack.Screen name="storybook" />
            </Stack.Protected>
        </Stack>
    );
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
export default function RootLayout()
{
    const ColorScheme = useColorScheme();

    return (
        <NotivexThemeProvider>
            <GestureHandlerRootView>
                <ThemeProvider value={ ColorScheme === "dark" ? DarkTheme : DefaultTheme }>
                    <BottomSheetModalProvider>
                        <AuthProvider>
                            <RootNavigator />
                        </AuthProvider>
                    </BottomSheetModalProvider>
                </ThemeProvider>
            </GestureHandlerRootView>
        </NotivexThemeProvider>
    );
}
