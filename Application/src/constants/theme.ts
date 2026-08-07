/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, {@link https://www.nativewind.dev | NativeWind},
 * or {@link https://tamagui.dev/ | Tamagui}, or {@link https://reactnativeunistyles.vercel.app | unistyles},
 * etc.
 *
 * @module notivex/constants/theme
 *
 * @file      theme.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/* eslint-disable jsdoc/require-jsdoc */

import "@/global.css";
import { Platform } from "react-native";

export const Colors =
    {
        dark:
        {
            background: "#000000",
            backgroundElement: "#212225",
            backgroundSelected: "#2E3135",
            text: "#ffffff",
            textSecondary: "#B0B4BA"
        },
        light:
        {
            background: "#ffffff",
            backgroundElement: "#F0F0F3",
            backgroundSelected: "#E0E1E6",
            text: "#000000",
            textSecondary: "#60646C"
        }
    } as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
    default:
    {
        mono: "monospace",
        rounded: "normal",
        sans: "normal",
        serif: "serif"
    },
    ios:
    {
        /** iOS `UIFontDescriptorSystemDesignDefault` */
        sans: "system-ui",

        /** iOS `UIFontDescriptorSystemDesignSerif` */
        serif: "ui-serif",

        /** iOS `UIFontDescriptorSystemDesignRounded` */
        rounded: "ui-rounded",

        /** iOS `UIFontDescriptorSystemDesignMonospaced` */
        mono: "ui-monospace"
    },
    web:
    {
        mono: "var(--font-mono)",
        rounded: "var(--font-rounded)",
        sans: "var(--font-display)",
        serif: "var(--font-serif)"
    }
});

export const Spacing =
    {
        /* eslint-disable sort-keys */
        XS: 2,
        S: 4,
        M: 8,
        L: 16,
        XL: 24,
        XXL: 32,
        XXXL: 64
        /* eslint-enable sort-keys */
    } as const;

export const BottomTabInset = Platform.select({ android: 80, ios: 50 }) ?? 0;
export const MaxContentWidth = 800 as const;
