/**
 *
 *
 * @module notivex/components/app-tabs
 *
 * @file      app-tabs.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import { Colors } from "@/constants/theme";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

/* eslint-disable @typescript-eslint/no-require-imports, jsdoc/require-jsdoc */

export default function AppTabs()
{
    const scheme = useColorScheme();
    const colors = Colors[scheme === "unspecified" ? "light" : scheme];

    return (
        <NativeTabs
            backgroundColor={ colors.background }
            indicatorColor={ colors.backgroundElement }
            labelStyle={ { selected: { color: colors.text } } }>
            <NativeTabs.Trigger name="index">
                <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    renderingMode="template"
                    src={ require("@/assets/images/tabIcons/home.png") }
                />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="explore">
                <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    renderingMode="template"
                    src={ require("@/assets/images/tabIcons/explore.png") }
                />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
