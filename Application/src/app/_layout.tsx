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
import { ThemeProvider as NotivexThemeProvider } from "@notivex/ui";
import { useColorScheme } from "react-native";

// SplashScreen.preventAutoHideAsync();

// import { AnimatedSplashOverlay } from '@/components/animated-icon';
// import AppTabs from '@/components/app-tabs';

// export default function TabLayout()
// {
//   const colorScheme = useColorScheme();
//   return (
//     <NotivexThemeProvider>
//       <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//         <AnimatedSplashOverlay />
//         <AppTabs />
//       </ThemeProvider>
//     </NotivexThemeProvider>
//   );
// }

/* eslint-disable-next-line jsdoc/require-jsdoc */
export default function RootLayout()
{
    const ColorScheme = useColorScheme();
    return (
        <NotivexThemeProvider>
            <ThemeProvider value={ ColorScheme === "dark" ? DarkTheme : DefaultTheme }>
                <Stack screenOptions={ { headerShown: false } }>
                    <Stack.Screen name="index" />
                    <Stack.Protected guard={ __DEV__ }>
                        <Stack.Screen name="storybook" />
                    </Stack.Protected>
                </Stack>
            </ThemeProvider>
        </NotivexThemeProvider>
    );
}
